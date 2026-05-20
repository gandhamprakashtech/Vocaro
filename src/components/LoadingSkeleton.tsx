import { Skeleton } from "./Skeleton.tsx";

interface LoadingSkeletonProps {
  count?: number;
  type?: "card" | "list" | "stat";
}

export function LoadingSkeleton({
  count = 3,
  type = "card",
}: LoadingSkeletonProps) {
  if (type === "stat") {
    return (
      <div className="grid grid-cols-2 gap-4" role="status" aria-busy="true">
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (type === "list") {
    return (
      <div className="space-y-3" role="status" aria-busy="true">
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4" role="status" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-2xl" />
      ))}
    </div>
  );
}
