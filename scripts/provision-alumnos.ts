// Run with: npx tsx scripts/provision-alumnos.ts
// Creates/links an 'alumno' account for every student in the `students` table.
// Mirrors POST /api/alumno/provision. No emails are sent. Password = normalized RUT.
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

// Load .env.local into process.env (tsx does not do this automatically).
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) process.env[m[1]] ??= m[2].trim()
}

function toSubmissionRut(rut: string): string {
  return rut.trim().toLowerCase().replace(/[.\-\s]/g, '')
}

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface StudentRow {
  rut: string
  apellido_paterno: string | null
  apellido_materno: string | null
  nombres: string | null
  email: string | null
}

async function main() {
  const { data: studentsRaw, error } = await admin
    .from('students')
    .select('rut, apellido_paterno, apellido_materno, nombres, email')
  if (error) throw error
  const students = (studentsRaw ?? []) as StudentRow[]

  // Existing auth users by email.
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
    if (rut.length < 6) { result.errors.push(`${email}: RUT inválido (${st.rut})`); continue }
    const name = [st.nombres, st.apellido_paterno, st.apellido_materno].filter(Boolean).join(' ').trim() || email.split('@')[0]

    try {
      let userId = emailToId.get(email)
      if (!userId) {
        const { data, error } = await admin.auth.admin.createUser({
          email, password: rut, email_confirm: true,
          user_metadata: { name, role: 'alumno' },
        })
        if (error || !data.user) { result.errors.push(`${email}: ${error?.message ?? 'no se pudo crear'}`); continue }
        userId = data.user.id
        result.created++
      } else {
        result.linked++
      }
      const { error: pErr } = await admin.from('profiles')
        .upsert({ id: userId, name, role: 'alumno', rut }, { onConflict: 'id' })
      if (pErr) result.errors.push(`${email}: perfil - ${pErr.message}`)
    } catch (e) {
      result.errors.push(`${email}: ${e instanceof Error ? e.message : 'error'}`)
    }
  }

  console.log(`Creadas: ${result.created} · Vinculadas: ${result.linked} · Omitidas: ${result.skipped}`)
  if (result.errors.length) {
    console.log(`Errores (${result.errors.length}):`)
    result.errors.forEach(e => console.log('  ' + e))
  }
}

main().catch(e => { console.error(e); process.exit(1) })
