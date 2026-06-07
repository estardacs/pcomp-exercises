import GraderNavSkeleton from '@/components/GraderNavSkeleton'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <GraderNavSkeleton />
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        <Skeleton className="h-6 w-56" />
        {Array.from({ length: 3 }).map((_, g) => (
          <div key={g} className="space-y-2">
            <Skeleton className="h-3 w-12" />
            <div className="space-y-px">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
