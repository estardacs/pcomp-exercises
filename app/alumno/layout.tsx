import Link from 'next/link'
import { requireStudentPage } from '@/lib/auth'
import { Button } from '@/components/ui/button'

export default async function AlumnoLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireStudentPage()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/alumno" className="font-semibold tracking-tight">
            Pensamiento Computacional
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:inline">{profile.name}</span>
            <form action="/api/auth/logout" method="POST">
              <Button type="submit" size="sm" variant="ghost" className="h-8">
                Salir
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
