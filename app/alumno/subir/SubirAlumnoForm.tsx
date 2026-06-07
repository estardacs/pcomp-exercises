'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface Props {
  exercises: { id: string; title: string; due_date: string | null }[]
}

export default function SubirAlumnoForm({ exercises }: Props) {
  const router = useRouter()
  const [exerciseId, setExerciseId] = useState(exercises[0]?.id ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !exerciseId) return
    setUploading(true)
    setMsg(null)

    const fd = new FormData()
    fd.append('exercise_id', exerciseId)
    fd.append('file', file)

    try {
      const res = await fetch('/api/alumno/submissions', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setMsg({ ok: false, text: data.error ?? 'No se pudo subir la entrega' })
      } else {
        setMsg({ ok: true, text: data.replaced ? 'Entrega actualizada ✓' : 'Entrega recibida ✓' })
        setFile(null)
        router.refresh()
      }
    } catch {
      setMsg({ ok: false, text: 'Error de conexión' })
    }
    setUploading(false)
  }

  const dueText = (() => {
    const ex = exercises.find(e => e.id === exerciseId)
    if (!ex?.due_date) return null
    const due = new Date(ex.due_date)
    const closed = new Date() > due
    return { closed, label: due.toLocaleString('es-CL') }
  })()

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-5 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ejercicio</label>
        <select
          value={exerciseId}
          onChange={e => setExerciseId(e.target.value)}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {exercises.map(ex => (
            <option key={ex.id} value={ex.id}>{ex.id} - {ex.title}</option>
          ))}
        </select>
        {dueText && (
          <p className={`text-xs mt-1 ${dueText.closed ? 'text-red-600' : 'text-gray-500'}`}>
            {dueText.closed ? 'Plazo cerrado: ' : 'Plazo: '}{dueText.label}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Archivo (.ipynb)</label>
        <input
          type="file"
          accept=".ipynb"
          onChange={e => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {msg && (
        <p className={`text-sm rounded-md p-2 ${msg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {msg.text}
        </p>
      )}

      <Button type="submit" disabled={uploading || !file || !exerciseId} className="w-full">
        {uploading ? 'Subiendo…' : 'Subir entrega'}
      </Button>
    </form>
  )
}
