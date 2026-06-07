import Link from 'next/link'
import { requireGraderPage } from '@/lib/auth'
import AppShell from '@/components/AppShell'
import type { Exercise } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { ChevronRight } from 'lucide-react'

export default async function PautasPage() {
  const { profile, supabase } = await requireGraderPage()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await supabase.from('exercises').select('*').order('id') as any
  const exercises = (data ?? []) as Exercise[]

  const modules = ['M01', 'M02', 'M03']

  return (
    <AppShell name={profile.name} role={profile.role} active="/pauta">
      <main className="px-8 py-8 space-y-8 animate-in fade-in-0 duration-200">
        <div>
          <h1 className="text-xl font-semibold">Pautas de corrección</h1>
          <p className="text-sm text-gray-500 mt-1">
            Los cambios en una pauta se reflejan inmediatamente para todos los correctores.
          </p>
        </div>

        {modules.map(mod => {
          const exs = exercises.filter(e => e.module === mod)
          if (!exs.length) return null
          return (
            <div key={mod}>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{mod}</h2>
              <div className="bg-white border rounded-lg divide-y">
                {exs.map(ex => {
                  const numQ = ex.rubrica?.questions?.length ?? 0
                  const hasRubric = numQ > 0
                  return (
                    <Link
                      key={ex.id}
                      href={`/pauta/${ex.id}`}
                      className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-sm w-10 text-gray-600">{ex.id}</span>
                        <span className="font-medium">{ex.title}</span>
                        {ex.is_optional && (
                          <Badge variant="secondary" className="text-xs">Opcional</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-400">
                        {hasRubric ? (
                          <span>{numQ} preguntas · {ex.total_points} pt</span>
                        ) : (
                          <span className="text-amber-500">Sin pauta</span>
                        )}
                        <span className="text-blue-500 group-hover:underline inline-flex items-center gap-1">
                          Editar <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </main>
    </AppShell>
  )
}
