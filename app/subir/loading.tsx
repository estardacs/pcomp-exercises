import GraderNavSkeleton from '@/components/GraderNavSkeleton'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <GraderNavSkeleton>
      <div className="px-8 py-8 space-y-6">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </GraderNavSkeleton>
  )
}
