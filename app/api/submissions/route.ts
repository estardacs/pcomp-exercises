import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { parseFilename } from '@/lib/filename-parser'
import { parseNotebook } from '@/lib/notebook-parser'

export async function POST(req: NextRequest) {
  const supabase = createServiceClient()

  const formData = await req.formData()
  const files = formData.getAll('files') as File[]

  if (!files.length) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 })
  }

  const results = { created: 0, skipped: 0, errors: [] as string[] }

  for (const file of files) {
    const parsed = parseFilename(file.name)
    if (!parsed) {
      results.errors.push(`${file.name}: nombre de archivo inválido`)
      continue
    }

    try {
      const text = await file.text()
      const rawNb = JSON.parse(text)
      const notebook_json = parseNotebook(rawNb)

      // Upload to Storage
      const storagePath = `${parsed.exercise}/${file.name}`
      await supabase.storage.from('notebooks').upload(storagePath, file, { upsert: true })

      // Upsert submission
      const { error } = await supabase.from('submissions').upsert({
        exercise_id: parsed.exercise,
        student_apellido: parsed.apellido,
        student_nombre: parsed.nombre,
        student_rut: parsed.rut,
        rut_last_digit: parsed.rut_last_digit,
        filename: file.name,
        notebook_storage_path: storagePath,
        notebook_json,
        status: 'unassigned',
      }, { onConflict: 'exercise_id,student_rut' })

      if (error) {
        results.errors.push(`${file.name}: ${error.message}`)
      } else {
        results.created++
      }
    } catch (err) {
      results.errors.push(`${file.name}: error al parsear`)
    }
  }

  return NextResponse.json(results)
}
