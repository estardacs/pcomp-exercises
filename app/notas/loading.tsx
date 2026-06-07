import GraderNavSkeleton from '@/components/GraderNavSkeleton'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <GraderNavSkeleton>
      <div className="px-8 py-8">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-28" />
        </div>
        <Skeleton className="h-[70vh] w-full" />
      </div>
    </GraderNavSkeleton>
  )
}
