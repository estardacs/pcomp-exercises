'use client'

import { useState } from 'react'
import type { Exercise, ExerciseRubric, RubricQuestion } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Props {
  exercise: Exercise
}

export default function PautaClient({ exercise }: Props) {
  const router = useRouter()
  const [rubrica, setRubrica] = useState<ExerciseRubric>(exercise.rubrica)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function updateQuestion(n: number, patch: Partial<RubricQuestion>) {
    setRubrica(prev => ({
      ...prev,
      questions: prev.questions.map(q => q.n === n ? { ...q, ...patch } : q),
    }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    const res = await fetch(`/api/ejercicios/${exercise.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rubrica }),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/corregir/${exercise.id}`} className="text-gray-500 hover:text-gray-800 text-sm">
            ← Volver a corrección
          </Link>
          <h1 className="font-semibold">{exercise.id}: {exercise.title} - Editar pauta</h1>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-green-600">Guardado</span>}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-4">
        {rubrica.questions.map(q => (
          <div key={q.n} className="bg-white border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center gap-3 bg-gray-50">
              <span className="font-semibold text-sm">P{q.n}: {q.title}</span>
              <Badge variant="outline" className="text-xs">{q.max_points} pt</Badge>
              {q.rut_indexed && <Badge className="text-xs bg-blue-600">RUT indexado</Badge>}
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
                  Criterio de evaluación
                </label>
                <Textarea
                  value={q.criteria}
                  onChange={e => updateQuestion(q.n, { criteria: e.target.value })}
                  rows={3}
                  className="text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
                  Código ideal (opcional)
                </label>
                <Textarea
                  value={q.ideal_code ?? ''}
                  onChange={e => updateQuestion(q.n, { ideal_code: e.target.value || undefined })}
                  rows={4}
                  className="text-sm font-mono"
                  placeholder="# código de referencia..."
                />
              </div>

              {q.rut_indexed && (
                <>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
                      Template de output esperado
                    </label>
                    <Textarea
                      value={q.expected_template ?? ''}
                      onChange={e => updateQuestion(q.n, { expected_template: e.target.value || undefined })}
                      rows={2}
                      className="text-sm font-mono"
                      placeholder="{nombre}, {selection}, {rut_digit}..."
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
                      Mapa RUT (JSON: digito → valor)
                    </label>
                    <Textarea
                      value={q.rut_map ? JSON.stringify(q.rut_map, null, 2) : ''}
                      onChange={e => {
                        try {
                          const parsed = JSON.parse(e.target.value)
                          updateQuestion(q.n, { rut_map: parsed })
                        } catch {
                          // ignore invalid JSON while typing
                        }
                      }}
                      rows={6}
                      className="text-sm font-mono"
                      placeholder='{"0": "valor0", "1": "valor1", ..., "K": "valorK"}'
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        ))}

        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </main>
    </div>
  )
}
