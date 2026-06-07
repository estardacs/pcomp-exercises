'use client'

import { useEffect, useState } from 'react'

const ERROR_MESSAGES: Record<string, string> = {
  cas_no_ticket:  'La autentificacion con UC no retorno un ticket valido.',
  cas_invalid:    'El servidor CAS de la UC rechazo el ticket.',
  cas_network:    'No se pudo conectar con el servidor SSO de la UC.',
  cas_no_user:    'CAS no retorno un usuario valido.',
  auth_failed:    'No se pudo crear la sesion despues de autentificar con UC.',
  session_failed: 'No se pudo establecer la sesion. Intentalo nuevamente.',
  not_enrolled:   'Tu cuenta UC no esta inscrita en este curso.',
}

const C = {
  kw: '#a78bfa',
  fn: '#60a5fa',
  st: '#34d399',
  cm: '#6b7280',
  nu: '#fb923c',
  tx: 'rgba(255,255,255,0.78)',
} as const
type T = keyof typeof C
type Tok = [T, string]

const CODE: Tok[][] = [
  [['cm', '# bienvenido.py']],
  [['tx', '']],
  [['tx', 'ramo       '], ['tx', '= '], ['st', '"Pensamiento Computacional"']],
  [['tx', 'codigo     '], ['tx', '= '], ['st', '"DNO1063"']],
  [['tx', '']],
  [['tx', 'ejercicios '], ['tx', '= '], ['tx', '['],
    ['st', '"Datos"'], ['tx', ', '], ['st', '"Loops"'], ['tx', ', '],
    ['st', '"Funciones"'], ['tx', ', '], ['st', '"Visualizacion"'], ['tx', ']']],
  [['tx', '']],
  [['kw', 'for '], ['tx', 'i, ej '], ['kw', 'in '], ['fn', 'enumerate'], ['tx', '(ejercicios, '], ['nu', '1'], ['tx', '):']],
  [['tx', '    '], ['fn', 'print'], ['tx', '('], ['st', 'f"  Ejercicio {i}: {ej}"'], ['tx', ')']],
  [['tx', '']],
  [['fn', 'print'], ['tx', '('], ['st', 'f"\\nBienvenido a {ramo}!"'], ['tx', ')']],
]

const OUTPUT = [
  '  Ejercicio 1: Datos',
  '  Ejercicio 2: Loops',
  '  Ejercicio 3: Funciones',
  '  Ejercicio 4: Visualizacion',
  '',
  'Bienvenido a Pensamiento Computacional!',
]

// code finishes animating at: 0.6 + 11*0.07 + 0.3 ≈ 1.67s → show output at 1800ms
const OUTPUT_DELAY_MS = 1800

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isDev, setIsDev] = useState(false)
  const [devUser, setDevUser] = useState('')

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('error')
    if (code) setError(ERROR_MESSAGES[code] ?? `Error inesperado: ${code}`)
    setIsDev(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  }, [])

  return (
    <div className="flex h-screen overflow-hidden font-sans">

      {/* ══ PANEL IZQUIERDO ══ */}
      <div
        className="hidden lg:flex lg:w-[60%] relative flex-col overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #060f20 0%, #0d1f3c 35%, #142f58 65%, #1B4B8A 100%)' }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1.5px, transparent 1.5px)',
          backgroundSize: '28px 28px',
        }} />
        <div className="login-glow absolute pointer-events-none" style={{
          top: '40%', left: '50%', width: '520px', height: '520px',
          transform: 'translate(-50%, -50%)', borderRadius: '50%',
          background: 'radial-gradient(circle, #3B82F6 0%, transparent 68%)',
          filter: 'blur(72px)',
        }} />
        <div className="absolute pointer-events-none" style={{
          top: '-8%', right: '-6%', width: '360px', height: '360px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)',
          filter: 'blur(90px)', opacity: 0.1,
        }} />

        <div className="relative z-10 flex flex-col h-full px-14 py-11">
          <div className="flex-1 flex flex-col justify-start pt-14 gap-8">

            {/* Heading */}
            <div>
              <h1 className="login-drift text-white leading-[1.05] font-bold tracking-tight"
                style={{ fontSize: '3.75rem', animationDelay: '0.2s' }}>
                Pensamiento<br />
                <span style={{
                  backgroundImage: 'linear-gradient(95deg, #60A5FA 0%, #818cf8 50%, #a78bfa 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>Computacional</span>
              </h1>
              <p className="login-drift text-white/50 mt-5 text-[15px] leading-relaxed"
                style={{ animationDelay: '0.3s' }}>
                Sube tus ejercicios y revisa tus notas en linea.
              </p>
            </div>

            {/* Terminal */}
            <div className="login-drift rounded-2xl overflow-hidden w-full" style={{
              background: 'rgba(0,0,0,0.42)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(14px)',
              animationDelay: '0.4s',
            }}>
              {/* Title bar */}
              <div className="flex items-center gap-2 px-4 py-3" style={{
                background: 'rgba(0,0,0,0.28)',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
              }}>
                <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
                <span className="ml-3 text-white/25 text-xs font-mono">bienvenido.py</span>
                <span className="ml-auto text-white/20 text-[10px] font-mono tracking-wide">Python 3.11</span>
              </div>

              {/* Code lines with line numbers */}
              <div className="py-5 font-mono text-[13.5px] leading-[1.9]">
                {CODE.map((line, i) => (
                  <div key={i} className="login-code-line flex items-baseline"
                    style={{ animationDelay: `${0.6 + i * 0.07}s`, minHeight: '1.9em' }}>
                    <span className="w-10 text-right pr-5 select-none shrink-0 text-[11px]"
                      style={{ color: 'rgba(255,255,255,0.13)' }}>{i + 1}</span>
                    <span>
                      {line.map(([type, str], j) => (
                        <span key={j} style={{ color: C[type] }}>{str}</span>
                      ))}
                    </span>
                  </div>
                ))}
              </div>

              {/* Output section — appears after code finishes */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.18)' }}>
                <div className="flex items-center gap-2 px-4 py-2.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#28c840', opacity: 0.65 }} />
                  <span className="text-[10px] font-mono tracking-[0.2em] uppercase"
                    style={{ color: 'rgba(255,255,255,0.22)' }}>Output</span>
                </div>
                <div className="px-5 pb-5 font-mono text-[12.5px] leading-[1.8]"
                  style={{ color: 'rgba(255,255,255,0.38)', minHeight: '6rem' }}>
                  {OUTPUT.map((line, i) => (
                    <div key={i} className="login-code-line"
                      style={{ animationDelay: `${OUTPUT_DELAY_MS / 1000 + i * 0.1}s`, minHeight: line ? undefined : '0.9em' }}>
                      {line || ' '}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* ══ PANEL DERECHO ══ */}
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden px-10"
        style={{ background: '#ffffff' }}>

        {/* Subtle dot texture */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle, rgba(27,75,138,0.055) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }} />

        {/* Blob A — top-right, blue */}
        <div className="absolute pointer-events-none" style={{
          top: '-80px', right: '-80px',
          width: '500px', height: '500px',
          background: '#3B82F6',
          filter: 'blur(55px)',
          opacity: 0.38,
          willChange: 'transform',
          animation: 'floatBlobA 14s ease-in-out infinite',
        }} />

        {/* Blob B — bottom-left, violet */}
        <div className="absolute pointer-events-none" style={{
          bottom: '-80px', left: '-80px',
          width: '420px', height: '420px',
          background: '#818cf8',
          filter: 'blur(50px)',
          opacity: 0.30,
          willChange: 'transform',
          animation: 'floatBlobB 11s ease-in-out infinite',
          animationDelay: '-4s',
        }} />

        {/* Blob C — center accent */}
        <div className="absolute pointer-events-none" style={{
          top: '32%', right: '0%',
          width: '280px', height: '280px',
          background: '#60A5FA',
          filter: 'blur(40px)',
          opacity: 0.22,
          willChange: 'transform',
          animation: 'floatBlobC 9s ease-in-out infinite',
          animationDelay: '-3s',
        }} />

        {/* Mobile header */}
        <div className="lg:hidden relative z-10 mb-8 text-center login-drift"
          style={{ animationDelay: '0.1s' }}>
          <h1 className="text-2xl font-bold text-gray-900">Pensamiento Computacional</h1>
          <p className="text-gray-500 text-sm mt-1">DNO1063 · Diseño · UC</p>
        </div>

        {/* Card */}
        <div className="relative z-10 login-drift w-full max-w-[506px] rounded-3xl px-12 py-[84px]"
          style={{
            background: '#ffffff',
            border: '1px solid rgba(0,0,0,0.07)',
            boxShadow: '0 8px 40px rgba(27,75,138,0.1), 0 1px 4px rgba(0,0,0,0.06)',
            animationDelay: '0.25s',
          }}>

          <p className="text-[11px] font-mono text-gray-400 tracking-wider uppercase mb-3">
            DNO1063 · Diseño · UC
          </p>
          <h2 className="text-[1.75rem] font-bold text-gray-900 leading-tight mb-2">
            Ingresar al curso
          </h2>
          <p className="text-gray-500 text-[15px] mb-8 leading-relaxed">
            Usa tu cuenta UC para acceder a la plataforma.
          </p>

          {error && (
            <div className="mb-6 px-4 py-3.5 rounded-2xl text-sm text-red-700 leading-snug"
              style={{ background: '#FEF2F2', border: '1px solid #FCA5A5' }}>
              {error}
            </div>
          )}

          <a href="/api/auth/cas/login" className="block">
            <button
              className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-2xl font-semibold text-white text-base transition-all duration-150 active:scale-[0.98] hover:opacity-95"
              style={{
                background: 'linear-gradient(135deg, #1B4B8A 0%, #1e5dab 50%, #2563EB 100%)',
                boxShadow: '0 4px 20px rgba(27,75,138,0.38), 0 1px 4px rgba(27,75,138,0.25)',
              }}
              type="button"
            >
              <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0"
                style={{ background: 'rgba(255,255,255,0.2)' }}>
                UC
              </span>
              Ingresar con cuenta UC
            </button>
          </a>

          {isDev && (
            <div className="mt-6 pt-5 border-t border-dashed border-amber-300/60">
              <p className="text-[10px] font-mono text-amber-500 uppercase tracking-widest mb-2">
                Dev — bypass CAS
              </p>
              <form
                onSubmit={e => { e.preventDefault(); window.location.href = `/api/auth/dev-login?username=${encodeURIComponent(devUser)}` }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={devUser}
                  onChange={e => setDevUser(e.target.value)}
                  placeholder="usuario UC (ej: mmanzur)"
                  className="flex-1 border border-amber-200 rounded-xl px-3 py-2 text-sm bg-amber-50/50 placeholder:text-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-amber-400 hover:bg-amber-500 transition-colors"
                >
                  Entrar
                </button>
              </form>
            </div>
          )}

        </div>
      </div>

    </div>
  )
}
