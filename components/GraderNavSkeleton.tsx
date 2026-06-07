import { Skeleton } from '@/components/ui/skeleton'

// Matches the AppShell <nav> dimensions so the real nav swaps in without shift.
export default function GraderNavSkeleton() {
  return (
    <nav className="bg-white border-b">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <Skeleton className="h-5 w-40 shrink-0" />
        <div className="hidden sm:flex items-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-20" />
          ))}
        </div>
        <Skeleton className="h-7 w-16 shrink-0" />
      </div>
    </nav>
  )
}
