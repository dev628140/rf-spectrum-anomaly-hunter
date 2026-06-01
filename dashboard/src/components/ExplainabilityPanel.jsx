export default function ExplainabilityPanel({ imageUrl }) {
  return (
    <div className="rounded-3xl bg-slate-950/70 border border-cyan-500/20 shadow-2xl p-8">

      <div className="mb-6">
        <h3 className="text-4xl font-black">
          AI Explainability Engine
        </h3>

        <p className="text-2xl text-slate-400 mt-2">
          Interpretable anomaly detection results
        </p>
      </div>

      <div className="rounded-2xl overflow-hidden border border-slate-800">
        <img
          src={imageUrl}
          alt="Explainability"
          className="w-full h-auto"
        />
      </div>

    </div>
  );
}