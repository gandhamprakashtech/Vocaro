import { Skeleton } from "../Skeleton.tsx";

interface VocabularySkeletonProps {
  count?: number;
}

export function VocabularySkeleton({ count = 4 }: VocabularySkeletonProps) {
  return (
    <div className="space-y-3" role="status" aria-live="polite" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass rounded-2xl p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-8 w-8 rounded-xl" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5 mt-2" />
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
