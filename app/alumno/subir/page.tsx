import Link from 'next/link'
import { requireStudentPage } from '@/lib/auth'
import { ChevronLeft } from 'lucide-react'
import SubirAlumnoForm from './SubirAlumnoForm'
import type { Exercise } from '@/types/database'

export default async function AlumnoSubirPage() {
  const { profile, supabase } = await requireStudentPage()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: exercisesRaw } = await supabase
    .from('exercises')
    .select('id, title, due_date')
    .order('id') as any
  const exercises = (exercisesRaw ?? []) as Pick<Exercise, 'id' | 'title' | 'due_date'>[]

  return (
    <div className="space-y-5 animate-in fade-in-0 duration-200">
      <Link href="/alumno" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"><ChevronLeft className="w-3.5 h-3.5" /> Volver</Link>
      <div>
        <h1 className="text-xl font-semibold">Subir entrega</h1>
        <p className="text-sm text-gray-500">Sube tu archivo <code>.ipynb</code> para el ejercicio que elijas.</p>
      </div>

      {!profile.rut ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Tu cuenta no está vinculada a un RUT, así que no puedes subir entregas todavía.
          Contacta al profesor.
        </div>
      ) : (
        <SubirAlumnoForm exercises={exercises} />
      )}
    </div>
  )
}
