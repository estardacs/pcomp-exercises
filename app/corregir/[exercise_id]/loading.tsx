import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className="w-72 shrink-0 border-r bg-white p-3 space-y-2">
        <Skeleton className="h-8 w-full" />
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
          <Skeleton className="h-5 w-72" />
          <Skeleton className="h-8 w-40" />
        </div>
        <div className="bg-white border-b px-6 py-2 flex items-center justify-between">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-5 w-80" />
          <Skeleton className="h-7 w-24" />
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}
