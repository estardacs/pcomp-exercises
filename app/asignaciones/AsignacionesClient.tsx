'use client'

import { useState } from 'react'
import type { Profile } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ExerciseSummary {
  id: string
  title: string
  module: string
}

interface SubRow {
  id: string
  exercise_id: string
  assigned_to: string | null
  status: string
}

interface Props {
  exercises: ExerciseSummary[]
  users: Profile[]
  submissions: SubRow[]
}

export default function AsignacionesClient({ exercises, users, submissions }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState<string | null>(null)

  const statsFor = (exId: string) => {
    const all = submissions.filter(s => s.exercise_id === exId)
    const done = all.filter(s => s.status === 'done').length
    const unassigned = all.filter(s => !s.assigned_to).length

    const byUser: Record<string, { total: number; done: number }> = {}
    all.forEach(s => {
      if (!s.assigned_to) return
      byUser[s.assigned_to] = byUser[s.assigned_to] ?? { total: 0, done: 0 }
      byUser[s.assigned_to].total++
      if (s.status === 'done') byUser[s.assigned_to].done++
    })

    return { total: all.length, done, unassigned, byUser }
  }

  async function distribute(exerciseId: string) {
    setSaving(exerciseId)
    await fetch('/api/submissions/distribute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exercise_id: exerciseId }),
    })
    setSaving(null)
    router.refresh()
  }

  async function distributeAll() {
    setSaving('all')
    await fetch('/api/submissions/distribute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    setSaving(null)
    router.refresh()
  }

  const exercisesWithSubs = exercises.filter(ex => statsFor(ex.id).total > 0)
  const totalSubs = submissions.length
  const totalDone = submissions.filter(s => s.status === 'done').length
  const totalUnassigned = submissions.filter(s => !s.assigned_to).length

  return (
    <main className="max-w-5xl mx-auto px-6 py-8 space-y-6 animate-in fade-in-0 duration-200">
        <h1 className="text-xl font-semibold">Asignaciones</h1>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border rounded-lg p-4">
            <p className="text-xs text-gray-500">Total entregas</p>
            <p className="text-2xl font-bold">{totalSubs}</p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-xs text-gray-500">Sin asignar</p>
            <p className={`text-2xl font-bold ${totalUnassigned > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {totalUnassigned}
            </p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-xs text-gray-500">Revisados</p>
            <p className="text-2xl font-bold">{totalDone}<span className="text-sm font-normal text-gray-400"> / {totalSubs}</span></p>
          </div>
        </div>

        {/* Users summary */}
        {users.length > 0 && (
          <div className="bg-white border rounded-lg p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Carga por corrector</p>
            <div className="flex flex-wrap gap-3">
              {users.map(u => {
                const userSubs = submissions.filter(s => s.assigned_to === u.id)
                const userDone = userSubs.filter(s => s.status === 'done').length
                return (
                  <div key={u.id} className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-2">
                    <span className="text-sm font-medium">{u.name}</span>
                    <span className="text-xs text-gray-500">{userSubs.length} asignadas</span>
                    {userSubs.length > 0 && (
                      <span className="text-xs text-green-600">{userDone} ✓</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            La distribución es equitativa entre ayudantes. Los profesores no se incluyen.
          </p>
          <Button
            onClick={distributeAll}
            disabled={saving === 'all'}
            className="cursor-pointer"
          >
            {saving === 'all' ? 'Distribuyendo…' : 'Distribuir todo equitativamente'}
          </Button>
        </div>

        {exercisesWithSubs.length === 0 ? (
          <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
            No hay notebooks subidos aún.{' '}
            <Link href="/subir" className="text-blue-600 underline cursor-pointer">Subir tareas →</Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg border divide-y">
            {exercisesWithSubs.map(ex => {
              const { total, done, unassigned, byUser } = statsFor(ex.id)
              const pct = total > 0 ? Math.round((done / total) * 100) : 0
              const assignedCount = total - unassigned
              const isSaving = saving === ex.id

              return (
                <div key={ex.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: exercise info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{ex.id}</span>
                        <span className="text-xs text-gray-400">{ex.module}</span>
                        <span className="text-xs text-gray-500 truncate">{ex.title}</span>
                      </div>

                      {/* Progress */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="h-1.5 w-32 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{done}/{total} revisados</span>
                        {unassigned > 0 && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            {unassigned} sin asignar
                          </Badge>
                        )}
                      </div>

                      {/* Per-user breakdown */}
                      {assignedCount > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {Object.entries(byUser).map(([uid, stats]) => {
                            const name = users.find(u => u.id === uid)?.name ?? 'Desconocido'
                            const firstName = name.split(' ')[0]
                            return (
                              <span key={uid} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2 py-0.5">
                                {firstName}
                                <span className="font-medium">{stats.total}</span>
                                {stats.done > 0 && <span className="text-green-600">({stats.done}✓)</span>}
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Right: action */}
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span className="text-xs text-gray-400">{total} entregas</span>
                      <Button
                        size="sm"
                        variant={assignedCount === 0 ? 'default' : 'outline'}
                        onClick={() => distribute(ex.id)}
                        disabled={isSaving || users.length === 0}
                        className="cursor-pointer"
                      >
                        {isSaving ? 'Distribuyendo…' : assignedCount === 0 ? 'Distribuir' : 'Redistribuir'}
                      </Button>
                      {users.length > 0 && assignedCount > 0 && (
                        <span className="text-xs text-gray-400">
                          ~{Math.ceil(total / users.length)} por corrector
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
    </main>
  )
}
