'use client'

import { useEffect, useState } from 'react'

const ERROR_MESSAGES: Record<string, string> = {
  cas_no_ticket: 'La autentificacion con UC no retorno un ticket valido.',
  cas_invalid:   'El servidor CAS de la UC rechazo el ticket.',
  cas_network:   'No se pudo conectar con el servidor SSO de la UC.',
  cas_no_user:   'CAS no retorno un usuario valido.',
  auth_failed:   'No se pudo crear la sesion despues de autentificar con UC.',
  session_failed:'No se pudo establecer la sesion. Intentalo nuevamente.',
  not_enrolled:  'Tu cuenta UC no esta inscrita en este curso.',
}

// Token colors for Python syntax highlight
const C = {
  kw: '#a78bfa',                  // violet  — keywords
  fn: '#60a5fa',                  // blue    — functions
  op: '#f472b6',                  // pink    — operators
  nm: '#fbbf24',                  // amber   — numbers
  tx: 'rgba(255,255,255,0.78)',   // white   — plain text
} as const
type T = keyof typeof C
type Tok = [T, string]

const CODE: Tok[][] = [
  [['kw','def'],['tx',' '],['fn','quicksort'],['tx','(lista):']],
  [['tx','    '],['kw','if'],['tx',' '],['fn','len'],['tx','(lista) '],['op','<='],['tx',' '],['nm','1'],['tx',':']],
  [['tx','        '],['kw','return'],['tx',' lista']],
  [['tx','    '],['tx','pivote '],['op','='],['tx',' lista['],['fn','len'],['tx','(lista) '],['op','//'],['tx',' '],['nm','2'],['tx',']']],
  [['tx','    '],['tx','izq '],['op','='],['tx',' [x '],['kw','for'],['tx',' x '],['kw','in'],['tx',' lista '],['kw','if'],['tx',' x '],['op','<'],['tx',' pivote]']],
  [['tx','    '],['tx','med '],['op','='],['tx',' [x '],['kw','for'],['tx',' x '],['kw','in'],['tx',' lista '],['kw','if'],['tx',' x '],['op','=='],['tx',' pivote]']],
  [['tx','    '],['tx','der '],['op','='],['tx',' [x '],['kw','for'],['tx',' x '],['kw','in'],['tx',' lista '],['kw','if'],['tx',' x '],['op','>'],['tx',' pivote]']],
  [['tx','    '],['kw','return'],['tx',' '],['fn','quicksort'],['tx','(izq) '],['op','+'],['tx',' med '],['op','+'],['tx',' '],['fn','quicksort'],['tx','(der)']],
]

const TOPICS = ['Python 3', 'Algoritmos', 'Recursion', 'Estructuras de datos', 'Ordenamiento']

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

          {/* Badge institucional */}
          <div className="login-drift flex items-center gap-2.5" style={{ animationDelay: '0.05s' }}>
            <div
              className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <span className="text-white font-bold text-xs tracking-widest">UC</span>
              <span className="text-white/30">·</span>
              <span className="text-white/60 text-xs">Pontificia Universidad Católica de Chile</span>
            </div>
          </div>

          {/* Texto principal */}
          <div className="flex-1 flex flex-col justify-center gap-8 max-w-[500px]">

            <div>
              <div
                className="login-drift text-blue-300/60 text-[11px] font-mono tracking-[0.3em] mb-5 uppercase"
                style={{ animationDelay: '0.15s' }}
              >
                DNO1063 · Semestre 2026-A
              </div>

              <h1
                className="login-drift text-white leading-[1.05] font-bold tracking-tight"
                style={{ fontSize: '3.75rem', animationDelay: '0.25s' }}
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
                style={{ animationDelay: '0.35s' }}
              >
                Aprende a resolver problemas con algoritmos,<br />
                estructuras de datos y programacion en Python.
              </p>
            </div>

            {/* Pills temáticas */}
            <div className="login-drift flex flex-wrap gap-2" style={{ animationDelay: '0.45s' }}>
              {TOPICS.map(t => (
                <span
                  key={t}
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.7)',
                  }}
                >
                  {t}
                </span>
              ))}
            </div>

            {/* Terminal con código Python */}
            <div
              className="login-drift rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(0,0,0,0.42)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(14px)',
                animationDelay: '0.55s',
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
                <span className="ml-3 text-white/25 text-xs font-mono">quicksort.py</span>
              </div>

              {/* Líneas de código con stagger */}
              <div className="px-5 py-4 font-mono text-[12.5px] leading-[1.85]">
                {CODE.map((line, i) => (
                  <div
                    key={i}
                    className="login-code-line"
                    style={{ animationDelay: `${0.75 + i * 0.09}s` }}
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
            className="login-drift flex items-center justify-between"
            style={{ animationDelay: '0.6s' }}
          >
            <span className="text-white/20 text-xs">Facultad de Arquitectura, Diseño y Estudios Urbanos</span>
            <span className="text-white/20 text-xs font-mono">PUC · 2026</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          PANEL DERECHO — login limpio
          ══════════════════════════════════════ */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-8"
        style={{ background: '#EEF2F8' }}
      >
        {/* Header solo mobile */}
        <div className="lg:hidden mb-8 text-center login-drift" style={{ animationDelay: '0.1s' }}>
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

        {/* Card de login */}
        <div className="w-full max-w-[360px] login-drift" style={{ animationDelay: '0.3s' }}>
          <div
            className="bg-white rounded-2xl p-8"
            style={{
              boxShadow: '0 8px 40px rgba(0,0,0,0.09), 0 2px 8px rgba(0,0,0,0.06)',
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            {/* Icono UC */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
              style={{ background: 'linear-gradient(135deg, #1B4B8A 0%, #2563EB 100%)' }}
            >
              <span className="text-white font-bold text-sm tracking-wider">UC</span>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-1">Bienvenido</h2>
            <p className="text-sm text-gray-500 mb-7 leading-relaxed">
              Ingresa con tu cuenta institucional<br className="hidden sm:block" />
              para acceder al curso.
            </p>

            {error && (
              <div
                className="mb-5 px-4 py-3 rounded-xl text-sm text-red-700 leading-snug"
                style={{ background: '#FEF2F2', border: '1px solid #FCA5A5' }}
              >
                {error}
              </div>
            )}

            <a href="/api/auth/cas/login" className="block">
              <button
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl font-semibold text-white text-sm transition-all duration-150 active:scale-[0.98] hover:opacity-95"
                style={{
                  background: 'linear-gradient(135deg, #1B4B8A 0%, #1e5dab 50%, #2563EB 100%)',
                  boxShadow: '0 4px 16px rgba(27,75,138,0.4), 0 1px 3px rgba(27,75,138,0.3)',
                }}
                type="button"
              >
                <span
                  className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0"
                  style={{ background: 'rgba(255,255,255,0.2)' }}
                >
                  UC
                </span>
                Ingresar con cuenta UC
              </button>
            </a>
          </div>

          <p className="text-center text-[11px] text-gray-400 mt-5 leading-relaxed">
            Solo cuentas{' '}
            <span className="font-mono bg-gray-100 px-1 rounded">@uc.cl</span>
            {' '}y{' '}
            <span className="font-mono bg-gray-100 px-1 rounded">@estudiante.uc.cl</span>
            <br />inscritas en el curso.
          </p>
        </div>
      </div>
    </div>
  )
}
