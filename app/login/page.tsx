'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const ERROR_MESSAGES: Record<string, string> = {
  cas_no_ticket: 'La autentificacion con UC no retorno un ticket valido.',
  cas_invalid: 'El servidor CAS de la UC rechazo el ticket.',
  cas_network: 'No se pudo conectar con el servidor SSO de la UC.',
  cas_no_user: 'CAS no retorno un usuario valido.',
  auth_failed: 'No se pudo crear la sesion despues de autentificar con UC.',
  session_failed: 'No se pudo establecer la sesion. Intentalo nuevamente.',
  not_enrolled: 'Tu cuenta UC no esta inscrita en este curso.',
}

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('error')
    if (code) setError(ERROR_MESSAGES[code] ?? `Error: ${code}`)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-sm animate-in fade-in-0 duration-200">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Pensamiento Computacional</CardTitle>
          <CardDescription>Ingresa con tu cuenta UC para continuar.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded p-2 mb-4">{error}</p>
          )}
          <a href="/api/auth/cas/login" className="block">
            <Button
              className="w-full bg-[#1B4B8A] hover:bg-[#1B4B8A]/90 text-white font-medium"
              type="button"
            >
              <span className="mr-2 font-bold text-base leading-none">UC</span>
              Ingresar con cuenta UC
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  )
}
