from backend.services.model_registry import ModelRegistry


class InferenceService:
    def __init__(self):
        self.registry = ModelRegistry()

    @property
    def threshold(self):
        current = self.registry.get_current_model()

        if current == "autoencoder":
            return self.registry.models[
                "autoencoder"
            ]["threshold"]

        return 0.5

    def predict(self, window):
        return self.registry.predict(window)

    def predict_all(self, window):
        return self.registry.predict_all(window)

    def switch_model(self, model_name):
        self.registry.switch_model(model_name)

    def current_model(self):
        return self.registry.get_current_model()

    def available_models(self):
        return self.registry.available_models()
inference_service = InferenceService()