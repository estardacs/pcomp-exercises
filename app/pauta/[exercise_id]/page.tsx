import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import type { Exercise } from '@/types/database'
import PautaClient from './PautaClient'

interface Props {
  params: Promise<{ exercise_id: string }>
}

export default async function PautaPage({ params }: Props) {
  const { exercise_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await supabase.from('exercises').select('*').eq('id', exercise_id).single() as any
  if (!data) notFound()

  return <PautaClient exercise={data as Exercise} />
}
