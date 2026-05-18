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
      <div className="grid grid-cols-2 gap-4 animate-pulse">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-2xl bg-gray-100 dark:bg-gray-800"
          />
        ))}
      </div>
    );
  }

  if (type === "list") {
    return (
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-32 rounded-2xl bg-gray-100 dark:bg-gray-800"
        />
      ))}
    </div>
  );
}
