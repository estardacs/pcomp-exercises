import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UsuariosClient from './UsuariosClient'
import type { Profile } from '@/types/database'

export default async function UsuariosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usersRaw } = await supabase.from('profiles').select('*').order('name') as any
  const users = (usersRaw ?? []) as Profile[]

  return <UsuariosClient users={users} currentUserId={user.id} />
}
