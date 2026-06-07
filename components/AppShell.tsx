import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface NavItem {
  href: string
  label: string
  profesorOnly?: boolean
}

const NAV: NavItem[] = [
  { href: '/subir', label: 'Subir tareas' },
  { href: '/asignaciones', label: 'Asignaciones' },
  { href: '/pauta', label: 'Pautas' },
  { href: '/resultados', label: 'Resultados' },
  { href: '/notas', label: 'Notas curso' },
  { href: '/usuarios', label: 'Usuarios', profesorOnly: true },
]

interface Props {
  name: string
  role: 'profesor' | 'ayudante' | 'alumno'
  active?: string
  children: React.ReactNode
}

/** Shared top-nav shell for grader pages. */
export default function AppShell({ name, role, active, children }: Props) {
  const items = NAV.filter(i => !i.profesorOnly || role === 'profesor')

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <Link href="/dashboard" className="font-bold tracking-tight shrink-0">
            Corrector <span className="text-blue-600">DNO1063</span>
          </Link>
          <div className="flex items-center gap-1 overflow-x-auto">
            {items.map(i => (
              <Link
                key={i.href}
                href={i.href}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors ${
                  active === i.href
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {i.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm text-gray-500 hidden md:inline">{name}</span>
            <form action="/api/auth/logout" method="POST">
              <Button variant="ghost" size="sm" type="submit">Salir</Button>
            </form>
          </div>
        </div>
      </nav>
      {children}
    </div>
  )
}
