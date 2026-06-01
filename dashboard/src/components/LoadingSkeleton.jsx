export default function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
      {[1, 2, 3, 4].map((x) => (
        <div
          key={x}
          className="h-32 rounded-2xl bg-slate-800 animate-pulse"
        />
      ))}
    </div>
  );
}