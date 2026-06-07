import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'

export type Role = 'profesor' | 'ayudante' | 'alumno'

export function isGrader(profile: Pick<Profile, 'role'> | null): boolean {
  return profile?.role === 'profesor' || profile?.role === 'ayudante'
}

export function isProfesor(profile: Pick<Profile, 'role'> | null): boolean {
  return profile?.role === 'profesor'
}

/** Loads the authenticated user + their profile. Either may be null. */
export async function getSessionProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, profile: null, supabase }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single() as any
  return { user, profile: (data as Profile | null), supabase }
}

/**
 * For server components in grader-only pages. Redirects unauthenticated users to
 * /login and students to their own portal. Returns the grader's user + profile.
 */
export async function requireGraderPage() {
  const { user, profile, supabase } = await getSessionProfile()
  if (!user || !profile) redirect('/login')
  if (!isGrader(profile)) redirect('/alumno')
  return { user, profile, supabase }
}

/** For server components in student-only pages. */
export async function requireStudentPage() {
  const { user, profile, supabase } = await getSessionProfile()
  if (!user || !profile) redirect('/login')
  if (isGrader(profile)) redirect('/dashboard')
  return { user, profile, supabase }
}

/**
 * For route handlers. Returns `{ error }` (a ready-to-return NextResponse) when
 * the caller is not an authenticated grader, otherwise `{ user, profile, supabase }`.
 */
export async function requireGraderApi() {
  const { user, profile, supabase } = await getSessionProfile()
  if (!user) return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  if (!isGrader(profile)) return { error: NextResponse.json({ error: 'Requiere rol corrector' }, { status: 403 }) }
  return { user, profile: profile!, supabase }
}

/** Like requireGraderApi but requires the 'profesor' role. */
export async function requireProfesorApi() {
  const { user, profile, supabase } = await getSessionProfile()
  if (!user) return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  if (!isProfesor(profile)) return { error: NextResponse.json({ error: 'Requiere rol profesor' }, { status: 403 }) }
  return { user, profile: profile!, supabase }
}

/** For route handlers in the student area. */
export async function requireStudentApi() {
  const { user, profile, supabase } = await getSessionProfile()
  if (!user) return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  if (!profile) return { error: NextResponse.json({ error: 'Perfil no encontrado' }, { status: 403 }) }
  return { user, profile, supabase }
}
