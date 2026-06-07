import { redirect } from 'next/navigation'
import { getSessionProfile, isGrader } from '@/lib/auth'

export default async function Home() {
  const { user, profile } = await getSessionProfile()
  if (!user || !profile) redirect('/login')
  redirect(isGrader(profile) ? '/dashboard' : '/alumno')
}
