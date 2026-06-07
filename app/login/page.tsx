'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const CAS_ERROR_MESSAGES: Record<string, string> = {
  cas_no_ticket: 'La autentificacion con UC no retorno un ticket valido.',
  cas_invalid: 'El servidor CAS de la UC rechazo el ticket.',
  cas_network: 'No se pudo conectar con el servidor SSO de la UC.',
  cas_no_user: 'CAS no retorno un usuario valido.',
  auth_failed: 'No se pudo crear la sesion despues de autentificar con UC.',
  session_failed: 'No se pudo establecer la sesion. Intentalo nuevamente.',
  not_enrolled: 'Tu cuenta UC no esta inscrita en este curso.',
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCorrector, setShowCorrector] = useState(false)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const code = p.get('error')
    if (code) setError(CAS_ERROR_MESSAGES[code] ?? `Error: ${code}`)
  }, [])

  async function handleCorrector(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md animate-in fade-in-0 duration-200">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Pensamiento Computacional</CardTitle>
          <CardDescription>Ingresa con tu cuenta UC para continuar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>
          )}

          <a href="/api/auth/cas/login" className="block">
            <Button
              variant="outline"
              className="w-full border-[#1B4B8A] text-[#1B4B8A] hover:bg-[#1B4B8A]/5 font-medium"
              type="button"
            >
              <span className="mr-2 font-bold text-base leading-none">UC</span>
              Ingresar con cuenta UC
            </Button>
          </a>

          {!showCorrector ? (
            <button
              type="button"
              onClick={() => setShowCorrector(true)}
              className="w-full text-xs text-gray-400 hover:text-gray-600 text-center pt-1"
            >
              Soy ayudante o profesor sin cuenta UC
            </button>
          ) : (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-400">Acceso corrector</span>
                </div>
              </div>

              <form onSubmit={handleCorrector} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electronico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@uc.cl"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contrasena</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Ingresando...' : 'Ingresar'}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
