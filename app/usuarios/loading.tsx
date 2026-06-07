import GraderNavSkeleton from '@/components/GraderNavSkeleton'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <GraderNavSkeleton />
      <main className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </main>
    </div>
  )
}
