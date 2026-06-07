import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireProfesorApi } from '@/lib/auth'
import { toSubmissionRut } from '@/lib/rut-utils'

interface StudentRow {
  rut: string
  apellido_paterno: string | null
  apellido_materno: string | null
  nombres: string | null
  email: string | null
}

// Profesor-only: create (or link) an 'alumno' account for every student in the
// `students` table that has an email. The temporary password is the student's
// normalized RUT; profiles.rut is stored in the submissions format so RLS can
// match each student to their own submissions.
export async function POST() {
  const auth = await requireProfesorApi()
  if (auth.error) return auth.error

  const admin = createServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: studentsRaw, error: studentsErr } = await admin
    .from('students')
    .select('rut, apellido_paterno, apellido_materno, nombres, email') as any
  if (studentsErr) return NextResponse.json({ error: studentsErr.message }, { status: 500 })
  const students = (studentsRaw ?? []) as StudentRow[]

  // Map existing auth users by email to avoid duplicate-creation errors.
  const emailToId = new Map<string, string>()
  for (let page = 1; page <= 20; page++) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    const users = data?.users ?? []
    users.forEach(u => { if (u.email) emailToId.set(u.email.toLowerCase(), u.id) })
    if (users.length < 200) break
  }

  const result = { created: 0, linked: 0, skipped: 0, errors: [] as string[] }

  for (const st of students) {
    const email = st.email?.trim().toLowerCase()
    if (!email) { result.skipped++; continue }

    const rut = toSubmissionRut(st.rut)
    if (rut.length < 6) {
      result.errors.push(`${email}: RUT inválido (${st.rut})`)
      continue
    }
    const name = [st.nombres, st.apellido_paterno, st.apellido_materno]
      .filter(Boolean).join(' ').trim() || email.split('@')[0]

    try {
      let userId = emailToId.get(email)

      if (!userId) {
        const { data, error } = await admin.auth.admin.createUser({
          email,
          password: rut,
          email_confirm: true,
          user_metadata: { name, role: 'alumno' },
        })
        if (error || !data.user) {
          result.errors.push(`${email}: ${error?.message ?? 'no se pudo crear'}`)
          continue
        }
        userId = data.user.id
        result.created++
      } else {
        result.linked++
      }

      const { error: profileErr } = await admin
        .from('profiles')
        .upsert({ id: userId, name, role: 'alumno', rut }, { onConflict: 'id' })
      if (profileErr) result.errors.push(`${email}: perfil - ${profileErr.message}`)
    } catch (err) {
      result.errors.push(`${email}: ${err instanceof Error ? err.message : 'error'}`)
    }
  }

  return NextResponse.json(result)
}
