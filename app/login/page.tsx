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

// Token colors for Python syntax highlight
const C = {
  kw: '#a78bfa',                  // violet  — keywords
  fn: '#60a5fa',                  // blue    — functions
  st: '#34d399',                  // emerald — strings
  cm: '#6b7280',                  // gray    — comments
  tx: 'rgba(255,255,255,0.78)',   // white   — plain text
} as const
type T = keyof typeof C
type Tok = [T, string]

const CODE: Tok[][] = [
  [['cm', '# bienvenido.py']],
  [['tx', '']],
  [['tx', 'ramo     '], ['tx', '= '], ['st', '"Pensamiento Computacional"']],
  [['tx', 'codigo   '], ['tx', '= '], ['st', '"DNO1063"']],
  [['tx', 'semestre '], ['tx', '= '], ['st', '"2026-A"']],
  [['tx', 'facultad '], ['tx', '= '], ['st', '"Diseño · PUC"']],
  [['tx', '']],
  [['fn', 'print'], ['tx', '('], ['st', '"Ramo:"'],     ['tx', ', ramo)']],
  [['fn', 'print'], ['tx', '('], ['st', '"Codigo:"'],   ['tx', ', codigo)']],
  [['fn', 'print'], ['tx', '('], ['st', '"Semestre:"'], ['tx', ', semestre)']],
  [['fn', 'print'], ['tx', '('], ['st', '"Facultad:"'], ['tx', ', facultad)']],
]

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('error')
    if (code) setError(ERROR_MESSAGES[code] ?? `Error inesperado: ${code}`)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden font-sans">

      {/* ══════════════════════════════════════
          PANEL IZQUIERDO — branding oscuro
          ══════════════════════════════════════ */}
      <div
        className="hidden lg:flex lg:w-[60%] relative flex-col overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #060f20 0%, #0d1f3c 35%, #142f58 65%, #1B4B8A 100%)' }}
      >
        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1.5px, transparent 1.5px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Glow central */}
        <div
          className="login-glow absolute pointer-events-none"
          style={{
            top: '40%', left: '50%',
            width: '520px', height: '520px',
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #3B82F6 0%, transparent 68%)',
            filter: 'blur(72px)',
          }}
        />

        {/* Glow acento esquina superior derecha */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '-8%', right: '-6%',
            width: '360px', height: '360px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)',
            filter: 'blur(90px)',
            opacity: 0.1,
          }}
        />

        {/* Contenido */}
        <div className="relative z-10 flex flex-col h-full px-14 py-11">

          {/* Texto principal */}
          <div className="flex-1 flex flex-col justify-center gap-9 max-w-[500px]">
            <div>
              <div
                className="login-drift text-blue-300/60 text-[11px] font-mono tracking-[0.3em] mb-5 uppercase"
                style={{ animationDelay: '0.1s' }}
              >
                DNO1063 · Semestre 2026-A
              </div>

              <h1
                className="login-drift text-white leading-[1.05] font-bold tracking-tight"
                style={{ fontSize: '3.75rem', animationDelay: '0.2s' }}
              >
                Pensamiento<br />
                <span style={{
                  backgroundImage: 'linear-gradient(95deg, #60A5FA 0%, #818cf8 50%, #a78bfa 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  Computacional
                </span>
              </h1>

              <p
                className="login-drift text-white/50 mt-5 text-[15px] leading-relaxed"
                style={{ animationDelay: '0.3s' }}
              >
                Sube tus ejercicios y revisa tus notas en linea.
              </p>
            </div>

            {/* Terminal con código Python */}
            <div
              className="login-drift rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(0,0,0,0.42)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(14px)',
                animationDelay: '0.4s',
              }}
            >
              {/* Barra de la terminal */}
              <div
                className="flex items-center gap-2 px-4 py-3"
                style={{ background: 'rgba(0,0,0,0.28)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
                <span className="ml-3 text-white/25 text-xs font-mono">bienvenido.py</span>
              </div>

              {/* Líneas de código con stagger */}
              <div className="px-5 py-4 font-mono text-[12.5px] leading-[1.85]">
                {CODE.map((line, i) => (
                  <div
                    key={i}
                    className="login-code-line"
                    style={{ animationDelay: `${0.6 + i * 0.08}s`, minHeight: '1.85em' }}
                  >
                    {line.map(([type, str], j) => (
                      <span key={j} style={{ color: C[type] }}>{str}</span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pie de página */}
          <div
            className="login-drift"
            style={{ animationDelay: '0.5s' }}
          >
            <span className="text-white/20 text-xs">Facultad de Arquitectura, Diseño y Estudios Urbanos</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          PANEL DERECHO — login
          ══════════════════════════════════════ */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-14"
        style={{ background: '#EEF2F8' }}
      >
        {/* Header solo mobile */}
        <div className="lg:hidden mb-10 text-center login-drift" style={{ animationDelay: '0.1s' }}>
          <div
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-4"
            style={{ background: 'rgba(27,75,138,0.1)', border: '1px solid rgba(27,75,138,0.2)' }}
          >
            <span className="text-[#1B4B8A] font-bold text-sm tracking-wider">UC</span>
            <span className="text-[#1B4B8A]/30">·</span>
            <span className="text-[#1B4B8A]/70 text-sm">DNO1063</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Pensamiento Computacional</h1>
          <p className="text-gray-500 text-sm mt-1">Semestre 2026-A</p>
        </div>

        {/* Contenido del login — sin card, usa todo el ancho disponible */}
        <div className="w-full max-w-[440px] login-drift" style={{ animationDelay: '0.25s' }}>

          {/* Icono UC */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-8"
            style={{ background: 'linear-gradient(135deg, #1B4B8A 0%, #2563EB 100%)' }}
          >
            <span className="text-white font-bold tracking-wider">UC</span>
          </div>

          {/* Metadata del ramo */}
          <p className="text-[11px] font-mono text-gray-400 tracking-wider uppercase mb-3">
            DNO1063 · 2026-A · Diseño · PUC
          </p>

          <h2 className="text-[1.75rem] font-bold text-gray-900 leading-tight mb-2">
            Ingresar al curso
          </h2>
          <p className="text-gray-500 text-[15px] mb-10 leading-relaxed">
            Usa tu cuenta UC para acceder a la plataforma.
          </p>

          {error && (
            <div
              className="mb-6 px-4 py-3.5 rounded-2xl text-sm text-red-700 leading-snug"
              style={{ background: '#FEF2F2', border: '1px solid #FCA5A5' }}
            >
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
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0"
                style={{ background: 'rgba(255,255,255,0.2)' }}
              >
                UC
              </span>
              Ingresar con cuenta UC
            </button>
          </a>
        </div>
      </div>
    </div>
  )
}
