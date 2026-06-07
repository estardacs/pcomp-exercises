'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Supabase redirects here after processing the magic-link (implicit flow).
// The access token arrives in the URL hash (#access_token=...).
// The browser client detects it automatically and fires onAuthStateChange.
export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    let done = false

    async function handleSession(userId: string) {
      if (done) return
      done = true
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()
      router.replace(profile?.role === 'alumno' ? '/alumno' : '/dashboard')
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => { if (session) handleSession(session.user.id) }
    )

    const fallback = setTimeout(() => {
      if (!done) { done = true; router.replace('/login?error=session_failed') }
    }, 8000)

    return () => { subscription.unsubscribe(); clearTimeout(fallback) }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-gray-500">Iniciando sesion...</p>
    </div>
  )
}
