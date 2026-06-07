import GraderNavSkeleton from '@/components/GraderNavSkeleton'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <GraderNavSkeleton />
      <main className="px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-8 w-28" />
        </div>
        <Skeleton className="h-[70vh] w-full" />
      </main>
    </div>
  )
}
