import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import type { SubmissionWithGrades, Submission, QuestionGrade, Exercise, Profile } from '@/types/database'
import GradingView from '@/components/grading/GradingView'

interface Props {
  params: Promise<{ exercise_id: string }>
  searchParams: Promise<{ student?: string; mine?: string }>
}

export default async function CorregirPage({ params, searchParams }: Props) {
  const { exercise_id } = await params
  const { student: studentId, mine } = await searchParams
  const mineOnly = mine === 'true'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileRaw } = await supabase.from('profiles').select('*').eq('id', user.id).single() as any
  const profile = profileRaw as Profile | null
  if (!profile) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: exerciseRaw } = await supabase.from('exercises').select('*').eq('id', exercise_id).single() as any
  const exercise = exerciseRaw as Exercise | null
  if (!exercise) notFound()

  // If mineOnly, only fetch submissions assigned to this user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = supabase.from('submissions').select('*').eq('exercise_id', exercise_id).order('student_apellido') as any
  if (mineOnly) query = query.eq('assigned_to', user.id)

  const { data: submissionsRaw } = await query
  const submissions = (submissionsRaw ?? []) as Submission[]

  if (!submissions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        <p>No tienes alumnos asignados para {exercise_id}.</p>
      </div>
    )
  }

  const submissionIds = submissions.map(s => s.id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: allGradesRaw } = await supabase.from('question_grades').select('*').in('submission_id', submissionIds) as any
  const allGrades = (allGradesRaw ?? []) as QuestionGrade[]

  const submissionsWithGrades: SubmissionWithGrades[] = submissions.map(sub => ({
    ...sub,
    grades: allGrades.filter(g => g.submission_id === sub.id),
    exercise,
  }))

  const defaultId = studentId
    ?? submissionsWithGrades.find(s => s.assigned_to === user.id && s.status !== 'done')?.id
    ?? submissionsWithGrades.find(s => s.status !== 'done')?.id
    ?? submissionsWithGrades[0]?.id

  return (
    <GradingView
      submissions={submissionsWithGrades}
      exercise={exercise}
      initialStudentId={defaultId!}
      userId={user.id}
      mineOnly={mineOnly}
    />
  )
}
