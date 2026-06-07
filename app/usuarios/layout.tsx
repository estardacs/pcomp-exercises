import { requireGraderPage } from '@/lib/auth'

export default async function GraderLayout({ children }: { children: React.ReactNode }) {
  await requireGraderPage()
  return <>{children}</>
}
