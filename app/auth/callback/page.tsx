'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Supabase redirects here after processing the magic-link (implicit flow).
// The access token arrives in the URL hash: #access_token=...&refresh_token=...
// We parse it explicitly and call setSession so @supabase/ssr stores it in cookies.
export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    async function handle() {
      // Parse hash fragment
      const params = new URLSearchParams(window.location.hash.slice(1))
      const access_token = params.get('access_token')
      const refresh_token = params.get('refresh_token') ?? ''

      if (!access_token) {
        router.replace('/login?error=session_failed')
        return
      }

      const { data, error } = await supabase.auth.setSession({ access_token, refresh_token })

      if (error || !data.session) {
        router.replace('/login?error=session_failed')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.session.user.id)
        .single()

      router.replace(profile?.role === 'alumno' ? '/alumno' : '/dashboard')
    }

    handle()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-gray-500">Iniciando sesion...</p>
    </div>
  )
}
