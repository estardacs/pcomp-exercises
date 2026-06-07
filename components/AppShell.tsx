import Link from 'next/link'
import {
  LayoutDashboard,
  Upload,
  ClipboardList,
  BookOpen,
  TableProperties,
  Users,
  LogOut,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  profesorOnly?: boolean
}

const NAV: NavItem[] = [
  { href: '/dashboard',    label: 'Inicio',       icon: LayoutDashboard },
  { href: '/subir',        label: 'Subir tareas', icon: Upload },
  { href: '/asignaciones', label: 'Asignaciones', icon: ClipboardList },
  { href: '/pauta',        label: 'Pautas',       icon: BookOpen },
  { href: '/notas',        label: 'Notas',        icon: TableProperties },
  { href: '/usuarios',     label: 'Usuarios',     icon: Users, profesorOnly: true },
]

const ROLE_LABEL: Record<string, string> = {
  profesor: 'Profesor',
  ayudante: 'Ayudante',
  alumno: 'Alumno',
}

interface Props {
  name: string
  role: 'profesor' | 'ayudante' | 'alumno'
  active?: string
  children: React.ReactNode
}

export default function AppShell({ name, role, active, children }: Props) {
  const items = NAV.filter(i => !i.profesorOnly || role === 'profesor')
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className="w-[220px] shrink-0 flex flex-col bg-white border-r border-gray-100 h-full">

        {/* Brand */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100">
          <Link href="/dashboard" className="block group">
            <p className="text-[10px] font-mono text-gray-400 tracking-[0.18em] uppercase">DNO1063</p>
            <p className="font-bold text-gray-900 text-[15px] leading-snug mt-0.5 group-hover:text-blue-700 transition-colors">
              Pensamiento<br/>Computacional
            </p>
          </Link>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {items.map(({ href, label, icon: Icon }) => {
            const isActive = active === href ||
              (href !== '/dashboard' && !!active?.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
                />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User + logout */}
        <div className="border-t border-gray-100 px-4 py-4">
          <div className="flex items-center gap-3 mb-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <span className="text-white text-[11px] font-bold tracking-wide">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate leading-tight">{name}</p>
              <p className="text-[11px] text-gray-400 leading-tight mt-0.5">{ROLE_LABEL[role]}</p>
            </div>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              Cerrar sesión
            </button>
          </form>
        </div>

      </aside>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
