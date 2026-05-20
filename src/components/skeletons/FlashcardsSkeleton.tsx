import { Skeleton } from "../Skeleton.tsx";

export function FlashcardsSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-live="polite" aria-busy="true">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-xl" />
          <Skeleton className="h-5 w-28" />
        </div>
        <Skeleton className="h-4 w-14" />
      </div>
      <Skeleton className="h-2.5 w-full rounded-full" />
      <div className="glass rounded-3xl p-8">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-2xl" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="flex items-center justify-center gap-6">
        <Skeleton className="h-12 w-12 rounded-2xl" />
        <Skeleton className="h-12 w-12 rounded-2xl" />
        <Skeleton className="h-12 w-12 rounded-2xl" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
