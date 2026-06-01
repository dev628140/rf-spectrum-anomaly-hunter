export default function BackgroundFX() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-slate-950" />

      <div className="absolute top-0 left-0 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-red-500/10 blur-3xl" />

      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }}
      />
    </div>
  );
}