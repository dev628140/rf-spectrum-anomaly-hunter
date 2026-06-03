import time

from backend.core.config import (
    MODE,
    POLL_INTERVAL_SECONDS
)

from backend.core.logging import (
    get_logger
)

from backend.services.service_container import (
    inference_service,
    rf_state_service
)

from backend.services.event_writer import (
    EventWriter
)

from backend.services.health_service import (
    HealthService
)

from backend.services.mqtt_service import (
    MQTTService
)

from backend.services.intelligence_service import (
    compute_intelligence
)

from backend.services.alert_service import (
    AlertService
)

from edge.runtime.adapter_factory import (
    get_adapter
)


logger = get_logger(
    "edge_runtime"
)


class EdgeRuntime:

    def __init__(self):

        self.adapter = None
        self.inference = None
        self.writer = None
        self.health = None
        self.running = False
        self.alerts = None
        self.mqtt = None

    def start(self):

        logger.info(
            f"Starting edge runtime in mode: {MODE}"
        )

        self.adapter = get_adapter()

        self.inference = (
            inference_service
        )

        self.writer = EventWriter()

        self.mqtt = MQTTService()

        self.alerts = AlertService()
        self.alerts.mqtt = self.mqtt

        self.health = HealthService(
            mode=MODE,
            adapter_name=
                self.adapter.__class__.__name__
        )

        self.running = True

    def process_cycle(self):

        """
        =====================================
        GET RF WINDOW
        =====================================
        """

        try:

            window = (
                self.adapter.get_window()
            )

            rf_state_service.update(
                window
            )

        except Exception as e:

            logger.error(
                f"Adapter failure: {e}"
            )

            return

        if window is None:

            logger.warning(
                "No valid RF window available."
            )

            return

        """
        =====================================
        RUN INFERENCE
        =====================================
        """

        try:

            logger.info(
                f"[DEBUG] "
                f"window_shape={window.shape}"
            )

            start = time.time()

            # Predict for all three models
            model_results = self.inference.predict_all(window)
            
            # Active model is primary
            active_model = self.inference.current_model()
            active_res = model_results.get(active_model, {"status": "NORMAL", "score": 0.0})
            status = active_res["status"]
            score = active_res["score"]

            latency_ms = (
                time.time() - start
            ) * 1000

        except Exception as e:

            logger.error(
                f"Inference failure: {e}"
            )

            return

        """
        =====================================
        BUILD INTELLIGENCE
        =====================================
        """

        try:

            intelligence = (
                compute_intelligence(
                    {
                        "status": status,
                        "window": window
                    }
                )
            )

            """
            ALERTS
            """

            self.alerts.dispatch(
                intelligence=intelligence,
                score=float(score),
                latency_ms=float(latency_ms),
                min_power=float(window.min()),
                max_power=float(window.max())
            )

            """
            HEALTH
            """

            self.health.record(
                status=status,
                score=float(score),
                latency_ms=float(
                    latency_ms
                )
            )

            """
            WRITE DB METRIC
            """
            try:
                import numpy as np
                from backend.db.db_service import db_service
                db_service.create_rf_metric(
                    mean_power=float(window.mean()),
                    peak_power=float(window.max()),
                    min_power=float(window.min()),
                    dynamic_range=float(window.max() - window.min()),
                    occupancy_percent=float(np.mean(window > -40) * 100)
                )
            except Exception as db_met_err:
                logger.error(f"Failed to write RF Metric to DB: {db_met_err}")

            """
            WRITE STATE
            """

            self.writer.write_state(
                status=status,
                score=float(score),
                threshold=float(
                    self.inference.threshold
                ),
                active_model=self.inference.current_model(),
                intelligence=intelligence,
                model_scores=model_results
            )

            """
            EVENT LOG
            """

            self.writer.append_event(
                status=status,
                score=float(score)
            )

            """
            MQTT
            """

            self.mqtt.publish(
                "rf/status",
                {
                    "status": status,
                    "score": float(score),
                    "threshold": float(
                        self.inference.threshold
                    )
                }
            )

            self.mqtt.publish(
                "rf/health",
                self.health.snapshot()
            )

            self.mqtt.publish(
                "rf/events",
                {
                    "status": status,
                    "score": float(score)
                }
            )

            self.mqtt.publish(
                "rf/intelligence",
                intelligence
            )

        except Exception as e:

            logger.error(
                f"Persistence failure: {e}"
            )

            return

        logger.info(
            f"Detection | "
            f"status={status} "
            f"| score={float(score):.10f} "
            f"| latency={latency_ms:.2f}ms"
        )

    def run(self):

        while self.running:

            try:

                self.process_cycle()

                time.sleep(
                    POLL_INTERVAL_SECONDS
                )

            except Exception as e:

                logger.critical(
                    f"Unexpected runtime failure: {e}"
                )

                time.sleep(
                    POLL_INTERVAL_SECONDS
                )

    def shutdown(self):

        logger.info(
            "Shutting down edge runtime..."
        )

        if self.adapter:

            try:

                self.adapter.shutdown()

            except Exception as e:

                logger.error(
                    f"Adapter shutdown failure: {e}"
                )

        if self.mqtt:

            self.mqtt.shutdown()

        self.running = False

        logger.info(
            "Edge runtime stopped cleanly."
        )


def main():

    runtime = EdgeRuntime()

    try:

        runtime.start()

        runtime.run()

    except KeyboardInterrupt:

        runtime.shutdown()


if __name__ == "__main__":

    main()