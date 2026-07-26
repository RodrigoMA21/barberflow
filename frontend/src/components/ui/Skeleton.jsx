export default function Skeleton({ className = "" }) {
  return (
    <div className={`bg-surface-tertiary rounded-md animate-pulse-soft ${className}`} />
  );
}

export function CardSkeleton({ lines = 3 }) {
  return (
    <div className="card-static p-4 space-y-3">
      <Skeleton className="h-5 w-2/3" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i === lines - 2 ? "w-1/2" : "w-full"}`} />
      ))}
    </div>
  );
}
