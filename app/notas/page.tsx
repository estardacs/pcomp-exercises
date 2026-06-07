import { requireGraderPage } from '@/lib/auth'
import { loadGradesSheetData } from '@/lib/grades-sheet'
import AppShell from '@/components/AppShell'
import NotasClient from './NotasClient'
import type { Submission } from '@/types/database'
import { Button } from '@/components/ui/button'

export default async function NotasPage() {
  const { profile, supabase } = await requireGraderPage()

  const sheet = loadGradesSheetData()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: submissionsRaw } = await supabase.from('submissions').select('student_rut, exercise_id, nota_synced_at, total_score').not('nota_synced_at', 'is', null) as any

  const synced = (submissionsRaw ?? []) as Pick<Submission, 'student_rut' | 'exercise_id' | 'nota_synced_at' | 'total_score'>[]

  return (
    <AppShell name={profile.name} role={profile.role} active="/notas">
      <main className="px-6 py-6 animate-in fade-in-0 duration-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-bold text-lg">Notas del curso</h1>
          <a href="/api/notas/export">
            <Button variant="outline" size="sm">Exportar Excel</Button>
          </a>
        </div>
        <NotasClient sheet={sheet} synced={synced} />
      </main>
    </AppShell>
  )
}
