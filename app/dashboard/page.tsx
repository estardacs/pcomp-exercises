import { requireGraderPage } from '@/lib/auth'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PenLine, Eye } from 'lucide-react'

export default async function DashboardPage() {
  const { user, profile, supabase } = await requireGraderPage()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: exercisesRaw } = await supabase.from('exercises').select('id, title, module, total_points, is_optional').order('id') as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: submissionsRaw } = await supabase.from('submissions').select('exercise_id, status, assigned_to') as any

  const exercises = (exercisesRaw ?? []) as Array<{ id: string; title: string; module: string; total_points: number; is_optional: boolean }>
  const submissions = (submissionsRaw ?? []) as Array<{ exercise_id: string; status: string; assigned_to: string | null }>

  const statsBy = (exId: string) => {
    const all = submissions.filter(s => s.exercise_id === exId)
    const done = all.filter(s => s.status === 'done').length
    const mine = all.filter(s => s.assigned_to === user.id)
    const mineDone = mine.filter(s => s.status === 'done').length
    return { total: all.length, done, mine: mine.length, mineDone }
  }

  // Course-wide summary
  const totalSubs = submissions.length
  const totalDone = submissions.filter(s => s.status === 'done').length
  const mineAll = submissions.filter(s => s.assigned_to === user.id)
  const minePending = mineAll.filter(s => s.status !== 'done').length
  const globalPct = totalSubs > 0 ? Math.round((totalDone / totalSubs) * 100) : 0

  return (
    <AppShell name={profile.name} role={profile.role} active="/dashboard">
      <main className="px-8 py-8 animate-in fade-in-0 duration-200">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <Stat label="Entregas" value={totalSubs} />
        <Stat label="Revisadas" value={`${totalDone}`} sub={`${globalPct}%`} />
        <Stat label="Mías pendientes" value={minePending} accent={minePending > 0} />
        <Stat label="Ejercicios" value={exercises.length} />
      </div>

      <h2 className="text-xl font-semibold mb-4">Resumen de ejercicios</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {exercises.map(ex => {
          const { total, done, mine, mineDone } = statsBy(ex.id)
          const pct = total > 0 ? Math.round((done / total) * 100) : 0
          const minePct = mine > 0 ? Math.round((mineDone / mine) * 100) : 0

          return (
            <Card key={ex.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-medium text-gray-500">{ex.module} · {ex.id}</CardTitle>
                  {ex.is_optional && <Badge variant="secondary" className="text-xs">Opcional</Badge>}
                </div>
                <p className="font-semibold text-base leading-tight mt-1">{ex.title}</p>
              </CardHeader>
              <CardContent>
                {total > 0 ? (
                  <>
                    {mine > 0 && (
                      <div className="mb-3 bg-blue-50 border border-blue-100 rounded-md px-3 py-2">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-blue-700 font-medium">Mis asignadas</span>
                          <span className="text-blue-600 font-semibold">{mineDone}/{mine}</span>
                        </div>
                        <div className="h-1.5 bg-blue-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${minePct}%` }} />
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                      <span>Total: {done}/{total} revisados</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gray-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="mt-3 flex gap-2">
                      {mine > 0 ? (
                        <>
                          <Link href={`/corregir/${ex.id}?mine=true`} className="flex-1">
                            <Button size="sm" className="w-full gap-1.5" variant={mineDone === mine ? 'outline' : 'default'}>
                              {mineDone === mine ? '✓ Mis tareas listas' : <><PenLine className="w-3.5 h-3.5" /> Corregir mis tareas</>}
                            </Button>
                          </Link>
                          <Link href={`/corregir/${ex.id}`}>
                            <Button size="sm" variant="ghost" className="text-xs text-gray-400 px-2 gap-1">
                              Ver todas <Eye className="w-3 h-3" />
                            </Button>
                          </Link>
                        </>
                      ) : (
                        <Link href={`/corregir/${ex.id}`} className="flex-1">
                          <Button size="sm" className="w-full gap-1" variant="outline">
                            Ver todas <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">Sin alumnos subidos</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
      </main>
    </AppShell>
  )
}

function Stat({ label, value, sub, accent }: { label: string; value: number | string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${accent ? 'text-blue-700' : 'text-gray-900'}`}>
        {value}{sub && <span className="text-sm font-normal text-gray-400 ml-1">{sub}</span>}
      </p>
    </div>
  )
}
