import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AsignacionesClient from './AsignacionesClient'
import type { Profile } from '@/types/database'

export default async function AsignacionesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: exercisesRaw }, { data: profilesRaw }, { data: submissionsRaw }] = await Promise.all([
    supabase.from('exercises').select('id, title, module').order('id') as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    supabase.from('profiles').select('id, name').order('name') as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    supabase.from('submissions').select('id, exercise_id, assigned_to, status') as any, // eslint-disable-line @typescript-eslint/no-explicit-any
  ])

  const exercises = (exercisesRaw ?? []) as Array<{ id: string; title: string; module: string }>
  const profiles = (profilesRaw ?? []) as Profile[]
  const submissions = (submissionsRaw ?? []) as Array<{ id: string; exercise_id: string; assigned_to: string | null; status: string }>

  return (
    <AsignacionesClient
      exercises={exercises}
      users={profiles}
      submissions={submissions}
    />
  )
}
