import { Skeleton } from "../Skeleton.tsx";

export function RouteSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-live="polite" aria-busy="true">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-xl" />
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
