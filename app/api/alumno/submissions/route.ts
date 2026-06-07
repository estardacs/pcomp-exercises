import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireStudentApi } from '@/lib/auth'
import { parseNotebook } from '@/lib/notebook-parser'
import { rutLastDigit } from '@/lib/rut-utils'
import type { Exercise, Submission } from '@/types/database'

// Student self-upload. Identity (rut/name) comes from the authenticated profile,
// never from the filename, so the fragile filename parser is bypassed entirely.
export async function POST(req: NextRequest) {
  const auth = await requireStudentApi()
  if (auth.error) return auth.error
  const { user, profile } = auth

  if (!profile.rut) {
    return NextResponse.json(
      { error: 'Tu cuenta no está vinculada a un RUT. Contacta al profesor.' },
      { status: 400 }
    )
  }

  const formData = await req.formData()
  const exercise_id = String(formData.get('exercise_id') ?? '')
  const file = formData.get('file') as File | null

  if (!exercise_id) return NextResponse.json({ error: 'Falta el ejercicio' }, { status: 400 })
  if (!file || !file.name.endsWith('.ipynb')) {
    return NextResponse.json({ error: 'Debes subir un archivo .ipynb' }, { status: 400 })
  }

  const admin = createServiceClient()
  const rut = profile.rut

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: exerciseRaw } = await admin.from('exercises').select('*').eq('id', exercise_id).single() as any
  const exercise = exerciseRaw as Exercise | null
  if (!exercise) return NextResponse.json({ error: 'Ejercicio no encontrado' }, { status: 404 })

  if (exercise.due_date && new Date() > new Date(exercise.due_date)) {
    return NextResponse.json(
      { error: `El plazo de entrega de ${exercise_id} ya cerró.` },
      { status: 403 }
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingRaw } = await admin
    .from('submissions')
    .select('id, status')
    .eq('exercise_id', exercise_id)
    .eq('student_rut', rut)
    .maybeSingle() as any
  const existing = existingRaw as Pick<Submission, 'id' | 'status'> | null

  if (existing?.status === 'done') {
    return NextResponse.json(
      { error: 'Esta entrega ya fue corregida y no se puede reenviar.' },
      { status: 403 }
    )
  }

  let notebook_json
  try {
    notebook_json = parseNotebook(JSON.parse(await file.text()))
  } catch {
    return NextResponse.json({ error: 'No se pudo leer el notebook (.ipynb inválido)' }, { status: 400 })
  }

  const storagePath = `${exercise_id}/${rut}_${file.name}`
  await admin.storage.from('notebooks').upload(storagePath, file, { upsert: true })

  if (existing) {
    // Preserve assignment/status; only refresh the notebook content.
    const { error } = await admin.from('submissions').update({
      filename: file.name,
      notebook_storage_path: storagePath,
      notebook_json,
      uploaded_at: new Date().toISOString(),
      uploaded_by: user.id,
    }).eq('id', existing.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, replaced: true })
  }

  // New submission: derive name from the linked student record when available.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: studentRaw } = await admin
    .from('students')
    .select('apellido_paterno, apellido_materno, nombres')
    .eq('rut', rut)
    .maybeSingle() as any
  const nameParts = (profile.name ?? '').trim().split(/\s+/)
  const apellido = studentRaw?.apellido_paterno ?? nameParts.slice(-1)[0] ?? ''
  const nombre = studentRaw?.nombres ?? nameParts.slice(0, -1).join(' ') ?? profile.name ?? ''

  const { error } = await admin.from('submissions').insert({
    exercise_id,
    student_apellido: apellido,
    student_nombre: nombre,
    student_rut: rut,
    rut_last_digit: rutLastDigit(rut),
    filename: file.name,
    notebook_storage_path: storagePath,
    notebook_json,
    uploaded_by: user.id,
    status: 'unassigned',
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, replaced: false })
}
