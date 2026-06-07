import { redirect } from 'next/navigation'

// /corregir sin ejercicio especifico lleva al dashboard donde estan los ejercicios con pendientes
export default function CorregirIndex() {
  redirect('/dashboard')
}
