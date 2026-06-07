import { NextRequest, NextResponse } from 'next/server'
import { requireGraderApi } from '@/lib/auth'
import { scoreToNota } from '@/lib/grade-converter'
import { updateExerciseGrade, exerciseColumnIndex } from '@/lib/grades-sheet'
import type { Submission, Exercise } from '@/types/database'

export async function POST(req: NextRequest) {
  const auth = await requireGraderApi()
  if (auth.error) return auth.error
  const { user, profile, supabase } = auth

  const body = await req.json()
  const { submission_id } = body as { submission_id?: string }
  if (!submission_id) {
    return NextResponse.json({ error: 'submission_id requerido' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: submissionRaw } = await supabase.from('submissions').select('*').eq('id', submission_id).single() as any
  const submission = submissionRaw as Submission | null
  if (!submission) return NextResponse.json({ error: 'Entrega no encontrada' }, { status: 404 })

  if (profile.role !== 'profesor' && submission.assigned_to !== user.id) {
    return NextResponse.json({ error: 'No tienes permiso para esta entrega' }, { status: 403 })
  }

  if (submission.total_score == null) {
    return NextResponse.json({ error: 'La entrega no tiene puntaje asignado' }, { status: 400 })
  }

  if (exerciseColumnIndex(submission.exercise_id) === null) {
    return NextResponse.json({ error: `Ejercicio ${submission.exercise_id} no está en la hoja de notas` }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: exerciseRaw } = await supabase.from('exercises').select('total_points').eq('id', submission.exercise_id).single() as any
  const exercise = exerciseRaw as Pick<Exercise, 'total_points'> | null
  const maxPoints = exercise?.total_points ?? 6

  const nota = scoreToNota(submission.total_score, maxPoints)

  try {
    const { formattedNota } = updateExerciseGrade(
      submission.student_rut,
      submission.exercise_id,
      nota
    )

    const syncedAt = new Date().toISOString()
    const { error: syncError } = await supabase
      .from('submissions')
      .update({ nota_synced_at: syncedAt })
      .eq('id', submission_id)

    if (syncError) {
      console.warn('nota_synced_at update failed (run 002_nota_synced.sql):', syncError.message)
    }

    return NextResponse.json({
      ok: true,
      nota: formattedNota,
      nota_numeric: nota,
      exercise_id: submission.exercise_id,
      student_rut: submission.student_rut,
      nota_synced_at: syncedAt,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al actualizar la hoja de notas'
    return NextResponse.json({ error: message }, { status: 404 })
  }
}
