import { NextResponse } from 'next/server'
import { requireGraderApi } from '@/lib/auth'
import { loadGradesSheetData, getGradesCsvContent } from '@/lib/grades-sheet'
import type { Submission } from '@/types/database'

export async function GET(req: Request) {
  const auth = await requireGraderApi()
  if (auth.error) return auth.error
  const supabase = auth.supabase

  const url = new URL(req.url)
  if (url.searchParams.get('download') === '1') {
    const content = getGradesCsvContent()
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="NOTAS_PCOMP_2026A.csv"',
      },
    })
  }

  const sheet = loadGradesSheetData()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: submissionsRaw } = await supabase
    .from('submissions')
    .select('student_rut, exercise_id, nota_synced_at, total_score')
    .not('nota_synced_at', 'is', null) as any

  const synced = (submissionsRaw ?? []) as Pick<Submission, 'student_rut' | 'exercise_id' | 'nota_synced_at' | 'total_score'>[]

  return NextResponse.json({ sheet, synced })
}
