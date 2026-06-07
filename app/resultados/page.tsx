import { requireGraderPage } from '@/lib/auth'
import AppShell from '@/components/AppShell'
import ResultadosClient from './ResultadosClient'
import type { Submission, QuestionGrade } from '@/types/database'

export default async function ResultadosPage() {
  const { profile, supabase } = await requireGraderPage()

  const [{ data: subRaw }, { data: exRaw }, { data: gradesRaw }, { data: profRaw }] = await Promise.all([
    supabase.from('submissions').select('*').order('student_apellido') as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    supabase.from('exercises').select('id, title, total_points').order('id') as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    supabase.from('question_grades').select('*') as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    supabase.from('profiles').select('id, name').in('role', ['profesor', 'ayudante']) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
  ])

  return (
    <AppShell name={profile.name} role={profile.role} active="/resultados">
      <ResultadosClient
        submissions={(subRaw ?? []) as Submission[]}
        exercises={(exRaw ?? []) as Array<{ id: string; title: string; total_points: number }>}
        grades={(gradesRaw ?? []) as QuestionGrade[]}
        profiles={(profRaw ?? []) as Array<{ id: string; name: string }>}
      />
    </AppShell>
  )
}
