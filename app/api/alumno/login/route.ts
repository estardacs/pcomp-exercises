import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { toSubmissionRut } from '@/lib/rut-utils'

// Student login by RUT only (temporary "N° de alumno"). The RUT acts as both the
// account lookup key and the password (set during provisioning). Low-security by
// design and accepted as a temporary measure - RUTs are roster-public.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const rut = toSubmissionRut(String(body.rut ?? ''))
  if (rut.length < 6) {
    return NextResponse.json({ error: 'Ingresa un RUT válido (con dígito verificador).' }, { status: 400 })
  }

  const admin = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('rut', rut)
    .eq('role', 'alumno')
    .maybeSingle() as any

  if (!profile) {
    return NextResponse.json(
      { error: 'No encontramos una cuenta con ese RUT. Pídele al profesor que la cree.' },
      { status: 404 }
    )
  }

  const { data: userRes } = await admin.auth.admin.getUserById(profile.id)
  const email = userRes?.user?.email
  if (!email) {
    return NextResponse.json({ error: 'Tu cuenta no tiene un correo asociado.' }, { status: 400 })
  }

  // Sign in via the cookie-bound server client so the session cookies are set.
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password: rut })
  if (error) {
    return NextResponse.json(
      { error: 'No pudimos iniciar tu sesión. Es posible que tu contraseña haya cambiado; contacta al profesor.' },
      { status: 401 }
    )
  }

  return NextResponse.json({ ok: true })
}
