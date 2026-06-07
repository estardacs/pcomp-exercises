import { Skeleton } from '@/components/ui/skeleton'

export default function GraderNavSkeleton({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <aside className="w-[220px] shrink-0 flex flex-col bg-white border-r border-gray-100 h-full">
        <div className="px-5 pt-5 pb-4 border-b border-gray-100 space-y-2">
          <Skeleton className="h-2.5 w-16" />
          <Skeleton className="h-5 w-36" />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg" />
          ))}
        </nav>
        <div className="border-t border-gray-100 px-4 py-4 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-2.5 w-16" />
            </div>
          </div>
          <Skeleton className="h-8 w-full rounded-lg" />
        </div>
      </aside>
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
