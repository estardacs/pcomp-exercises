import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <Skeleton className="h-7 w-44" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </main>
  )
}
