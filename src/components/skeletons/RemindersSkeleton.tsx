import { Skeleton } from "../Skeleton.tsx";

interface RemindersSkeletonProps {
  count?: number;
}

export function RemindersSkeleton({ count = 4 }: RemindersSkeletonProps) {
  return (
    <div className="space-y-3" role="status" aria-live="polite" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass rounded-2xl p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-12 rounded-full" />
                <Skeleton className="h-4 w-14 rounded-full" />
              </div>
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-14" />
          </div>
        </div>
      ))}
    </div>
  );
}
