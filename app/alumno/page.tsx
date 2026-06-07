import Link from 'next/link'
import { requireStudentPage } from '@/lib/auth'
import { scoreToNota, formatNotaChilena } from '@/lib/grade-converter'
import { Button } from '@/components/ui/button'
import type { Exercise, Submission } from '@/types/database'

export default async function AlumnoDashboard() {
  const { profile, supabase } = await requireStudentPage()

  if (!profile.rut) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Tu cuenta todavía no está vinculada a un RUT, por lo que no podemos mostrar
        tus entregas. Escríbele al profesor para que la vincule.
      </div>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: exercisesRaw } = await supabase
    .from('exercises')
    .select('id, title, module, total_points, is_optional, due_date')
    .order('id') as any
  const exercises = (exercisesRaw ?? []) as Exercise[]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: subsRaw } = await supabase
    .from('submissions')
    .select('exercise_id, status, total_score')
    .eq('student_rut', profile.rut) as any
  const subs = (subsRaw ?? []) as Pick<Submission, 'exercise_id' | 'status' | 'total_score'>[]
  const byExercise = new Map(subs.map(s => [s.exercise_id, s]))

  const graded = subs.filter(s => s.status === 'done')
  const promedio = graded.length
    ? graded.reduce((acc, s) => {
        const ex = exercises.find(e => e.id === s.exercise_id)
        return acc + scoreToNota(s.total_score ?? 0, ex?.total_points ?? 6)
      }, 0) / graded.length
    : null

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-200">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Mis entregas</h1>
          <p className="text-sm text-gray-500">
            {graded.length} corregida{graded.length !== 1 ? 's' : ''}
            {promedio !== null && (
              <> · promedio <strong className="text-gray-700">{promedio.toFixed(1)}</strong></>
            )}
          </p>
        </div>
        <Link href="/alumno/subir">
          <Button size="sm">Subir entrega</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {exercises.map(ex => {
          const sub = byExercise.get(ex.id)
          const done = sub?.status === 'done'
          const nota = done ? scoreToNota(sub!.total_score ?? 0, ex.total_points || 6) : null

          return (
            <Link
              key={ex.id}
              href={`/alumno/${ex.id}`}
              className="block rounded-xl border bg-white p-4 hover:border-blue-400 hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">{ex.module} · {ex.id}</p>
                  <p className="font-medium leading-tight truncate">{ex.title}</p>
                </div>
                {nota !== null ? (
                  <span className={`shrink-0 rounded-lg px-2.5 py-1 text-sm font-bold ${
                    nota >= 4 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {formatNotaChilena(nota)}
                  </span>
                ) : (
                  <StatusChip status={sub?.status} />
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function StatusChip({ status }: { status?: string }) {
  if (status === 'in_progress' || status === 'pending' || status === 'unassigned') {
    return <span className="shrink-0 rounded-full bg-blue-50 text-blue-600 px-2.5 py-1 text-xs font-medium">En revisión</span>
  }
  return <span className="shrink-0 rounded-full bg-gray-100 text-gray-400 px-2.5 py-1 text-xs">Sin entregar</span>
}
