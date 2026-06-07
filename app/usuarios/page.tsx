import { requireGraderPage } from '@/lib/auth'
import AppShell from '@/components/AppShell'
import UsuariosClient from './UsuariosClient'
import type { Profile } from '@/types/database'

export default async function UsuariosPage() {
  const { user, profile, supabase } = await requireGraderPage()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usersRaw } = await supabase.from('profiles').select('*').in('role', ['profesor', 'ayudante']).order('name') as any
  const users = (usersRaw ?? []) as Profile[]

  return (
    <AppShell name={profile.name} role={profile.role} active="/usuarios">
      <UsuariosClient users={users} currentUserId={user.id} />
    </AppShell>
  )
}
