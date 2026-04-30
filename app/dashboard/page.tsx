import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Profile } from '@/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileRaw } = await supabase.from('profiles').select('*').eq('id', user.id).single() as any
  const profile = profileRaw as Profile | null
  if (!profile) redirect('/login')

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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="font-bold text-lg">Corrector DNO1063</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{profile.name}</span>
          <div className="flex gap-2">
            <Link href="/subir"><Button variant="outline" size="sm">Subir tareas</Button></Link>
            <Link href="/asignaciones"><Button variant="outline" size="sm">Asignaciones</Button></Link>
            <Link href="/pauta"><Button variant="outline" size="sm">Pautas</Button></Link>
            <Link href="/resultados"><Button variant="outline" size="sm">Resultados</Button></Link>
            <Link href="/usuarios"><Button variant="outline" size="sm">Usuarios</Button></Link>
          </div>
          <form action="/api/auth/logout" method="POST">
            <Button variant="ghost" size="sm" type="submit">Salir</Button>
          </form>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="text-xl font-semibold mb-6">Resumen de ejercicios</h2>

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
                              <Button size="sm" className="w-full" variant={mineDone === mine ? 'outline' : 'default'}>
                                {mineDone === mine ? '✓ Mis tareas listas' : 'Corregir mis tareas →'}
                              </Button>
                            </Link>
                            <Link href={`/corregir/${ex.id}`}>
                              <Button size="sm" variant="ghost" className="text-xs text-gray-400 px-2">
                                Ver todas
                              </Button>
                            </Link>
                          </>
                        ) : (
                          <Link href={`/corregir/${ex.id}`} className="flex-1">
                            <Button size="sm" className="w-full" variant="outline">
                              Ver todas →
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
    </div>
  )
}
