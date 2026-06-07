import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireStudentPage } from '@/lib/auth'
import { ChevronLeft } from 'lucide-react'
import { scoreToNota, formatNotaChilena } from '@/lib/grade-converter'
import { Button } from '@/components/ui/button'
import CellOutputView from '@/components/grading/CellOutputView'
import type { Exercise, Submission, QuestionGrade, ParsedQuestion } from '@/types/database'

interface Props {
  params: Promise<{ exercise_id: string }>
}

export default async function AlumnoExercisePage({ params }: Props) {
  const { exercise_id } = await params
  const { profile, supabase } = await requireStudentPage()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: exerciseRaw } = await supabase.from('exercises').select('*').eq('id', exercise_id).single() as any
  const exercise = exerciseRaw as Exercise | null
  if (!exercise) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: subRaw } = await supabase
    .from('submissions')
    .select('*')
    .eq('exercise_id', exercise_id)
    .eq('student_rut', profile.rut ?? '__none__')
    .maybeSingle() as any
  const submission = subRaw as Submission | null

  const back = (
    <Link href="/alumno" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"><ChevronLeft className="w-3.5 h-3.5" /> Volver</Link>
  )

  if (!submission) {
    return (
      <div className="space-y-4">
        {back}
        <div className="rounded-xl border bg-white p-6 text-center">
          <p className="font-medium">{exercise.id}: {exercise.title}</p>
          <p className="text-sm text-gray-500 mt-1">No tienes una entrega registrada para este ejercicio.</p>
          <Link href="/alumno/subir" className="inline-block mt-4">
            <Button size="sm">Subir entrega</Button>
          </Link>
        </div>
      </div>
    )
  }

  const isDone = submission.status === 'done'
  const questions = exercise.rubrica?.questions ?? []
  const answerByN = new Map<number, ParsedQuestion>(
    (submission.notebook_json?.questions ?? []).map(q => [q.n, q])
  )

  let grades: QuestionGrade[] = []
  if (isDone) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: gradesRaw } = await supabase
      .from('question_grades')
      .select('*')
      .eq('submission_id', submission.id) as any
    grades = (gradesRaw ?? []) as QuestionGrade[]
  }
  const gradeByN = new Map(grades.map(g => [g.question_n, g]))
  const nota = isDone ? scoreToNota(submission.total_score ?? 0, exercise.total_points || 6) : null

  return (
    <div className="space-y-5 animate-in fade-in-0 duration-200">
      {back}

      <div className="rounded-xl border bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-gray-400">{exercise.module} · {exercise.id}</p>
            <h1 className="text-lg font-semibold leading-tight">{exercise.title}</h1>
          </div>
          {isDone && nota !== null ? (
            <div className="text-center shrink-0">
              <div className={`rounded-xl px-4 py-2 text-2xl font-bold ${
                nota >= 4 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {formatNotaChilena(nota)}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                {submission.total_score ?? 0}/{exercise.total_points} pts
              </p>
            </div>
          ) : (
            <span className="shrink-0 rounded-full bg-blue-50 text-blue-600 px-3 py-1 text-xs font-medium">
              En revisión
            </span>
          )}
        </div>

        {isDone && submission.general_comment && (
          <div className="mt-4 rounded-lg bg-blue-50 border border-blue-100 p-3">
            <p className="text-xs font-medium text-blue-700 mb-1">Comentario general</p>
            <p className="text-sm text-blue-900 whitespace-pre-wrap">{submission.general_comment}</p>
          </div>
        )}

        {!isDone && (
          <p className="mt-3 text-sm text-gray-500">
            Tu entrega fue recibida y está pendiente de corrección. Cuando esté lista
            verás aquí tu nota y los comentarios.
          </p>
        )}
      </div>

      {questions.map(q => {
        const grade = gradeByN.get(q.n)
        const answer = answerByN.get(q.n)
        return (
          <div key={q.n} className="rounded-xl border bg-white overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between gap-2">
              <span className="font-medium text-sm">{q.title}</span>
              {isDone ? (
                <span className="text-sm font-semibold">
                  {grade?.score ?? 0}<span className="text-gray-400 font-normal">/{q.max_points}</span>
                </span>
              ) : (
                <span className="text-xs text-gray-400">{q.max_points} pt</span>
              )}
            </div>

            <div className="p-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Tu respuesta</p>
                {answer?.cells?.length ? (
                  <div className="space-y-2">
                    {answer.cells.map((cell, i) => (
                      <div key={i}>
                        {cell.type === 'code' ? (
                          <pre className="text-xs font-mono bg-gray-900 text-gray-100 rounded p-3 overflow-x-auto whitespace-pre-wrap">
                            {cell.source || '(vacío)'}
                          </pre>
                        ) : (
                          <p className="text-xs text-gray-600 italic bg-gray-50 rounded p-2 whitespace-pre-wrap">
                            {cell.source}
                          </p>
                        )}
                        {cell.outputs?.map((out, j) => <CellOutputView key={j} output={out} />)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">No se registró respuesta en esta pregunta.</p>
                )}
              </div>

              {isDone && grade?.comment && (
                <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
                  <p className="text-xs font-medium text-amber-700 mb-1">Comentario del corrector</p>
                  <p className="text-sm text-amber-900 whitespace-pre-wrap">{grade.comment}</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
