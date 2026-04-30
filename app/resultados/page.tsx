import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ResultadosClient from './ResultadosClient'
import type { Submission, QuestionGrade } from '@/types/database'

export default async function ResultadosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: subRaw }, { data: exRaw }, { data: gradesRaw }, { data: profRaw }] = await Promise.all([
    supabase.from('submissions').select('*').order('student_apellido') as any,
    supabase.from('exercises').select('id, title, total_points').order('id') as any,
    supabase.from('question_grades').select('*') as any,
    supabase.from('profiles').select('id, name') as any,
  ])

  return (
    <ResultadosClient
      submissions={(subRaw ?? []) as Submission[]}
      exercises={(exRaw ?? []) as Array<{ id: string; title: string; total_points: number }>}
      grades={(gradesRaw ?? []) as QuestionGrade[]}
      profiles={(profRaw ?? []) as Array<{ id: string; name: string }>}
    />
  )
}
