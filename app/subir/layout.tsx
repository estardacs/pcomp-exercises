import { requireGraderPage } from '@/lib/auth'
import AppShell from '@/components/AppShell'

export default async function SubirLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireGraderPage()
  return (
    <AppShell name={profile.name} role={profile.role} active="/subir">
      {children}
    </AppShell>
  )
}
