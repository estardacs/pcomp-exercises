import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { loadGradesSheetData } from '@/lib/grades-sheet'
import NotasClient from './NotasClient'
import type { Submission } from '@/types/database'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function NotasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sheet = loadGradesSheetData()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: submissionsRaw } = await supabase
    .from('submissions')
    .select('student_rut, exercise_id, nota_synced_at, total_score')
    .not('nota_synced_at', 'is', null) as any

  const synced = (submissionsRaw ?? []) as Pick<Submission, 'student_rut' | 'exercise_id' | 'nota_synced_at' | 'total_score'>[]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard"><Button variant="ghost" size="sm">← Dashboard</Button></Link>
          <h1 className="font-bold text-lg">Notas del curso — PCOMP 2026A</h1>
        </div>
        <a href="/api/notas?download=1">
          <Button variant="outline" size="sm">Exportar CSV</Button>
        </a>
      </nav>

      <main className="px-6 py-6">
        <NotasClient sheet={sheet} synced={synced} />
      </main>
    </div>
  )
}
