'use client'

import { useState, useMemo } from 'react'
import type { Submission, QuestionGrade } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface Props {
  submissions: Submission[]
  exercises: { id: string; title: string; total_points: number }[]
  grades: QuestionGrade[]
  profiles: { id: string; name: string }[]
}

export default function ResultadosClient({ submissions, exercises, grades, profiles }: Props) {
  const [filterEx, setFilterEx] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return submissions.filter(s => {
      if (filterEx !== 'all' && s.exercise_id !== filterEx) return false
      if (filterStatus !== 'all' && s.status !== filterStatus) return false
      if (search) {
        const q = search.toLowerCase()
        if (!`${s.student_apellido} ${s.student_nombre} ${s.student_rut}`.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [submissions, filterEx, filterStatus, search])

  // Stats
  const total = submissions.length
  const done = submissions.filter(s => s.status === 'done').length
  const avgScore = done > 0
    ? submissions.filter(s => s.total_score != null).reduce((sum, s) => sum + (s.total_score ?? 0), 0) / done
    : 0

  // Per-exercise averages
  const exStats = exercises.map(ex => {
    const exSubs = submissions.filter(s => s.exercise_id === ex.id && s.total_score != null)
    const avg = exSubs.length > 0
      ? exSubs.reduce((s, sub) => s + (sub.total_score ?? 0), 0) / exSubs.length
      : null
    // Worst question
    const exGrades = grades.filter(g =>
      submissions.find(s => s.id === g.submission_id && s.exercise_id === ex.id)
    )
    const byQ: Record<number, number[]> = {}
    exGrades.forEach(g => {
      if (g.score != null) {
        byQ[g.question_n] = byQ[g.question_n] ?? []
        byQ[g.question_n].push(g.score / g.max_points)
      }
    })
    let worstQ = null
    let worstPct = 1
    Object.entries(byQ).forEach(([qn, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length
      if (avg < worstPct) { worstPct = avg; worstQ = parseInt(qn) }
    })
    return { ...ex, avg, worstQ, worstPct }
  }).filter(e => e.avg != null)

  function exportCSV() {
    const rows = [
      ['Apellido', 'Nombre', 'RUT', 'Ejercicio', 'Total', 'Max', 'Estado', 'Ayudante', 'Comentario']
        .join(','),
      ...filtered.map(s => {
        const ex = exercises.find(e => e.id === s.exercise_id)
        const assignee = profiles.find(p => p.id === s.assigned_to)
        return [
          s.student_apellido, s.student_nombre, s.student_rut.toUpperCase(),
          s.exercise_id, s.total_score ?? '', ex?.total_points ?? '',
          s.status, assignee?.name ?? '', `"${(s.general_comment ?? '').replace(/"/g, '""')}"`
        ].join(',')
      })
    ].join('\n')
    const blob = new Blob([rows], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `notas_${filterEx === 'all' ? 'todos' : filterEx}.csv`; a.click()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-800 text-sm">← Dashboard</Link>
          <h1 className="font-semibold">Resultados</h1>
        </div>
        <Button size="sm" onClick={exportCSV}>Exportar CSV</Button>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border rounded-lg p-4">
            <p className="text-xs text-gray-500">Total alumnos</p>
            <p className="text-2xl font-bold">{total}</p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-xs text-gray-500">Revisados</p>
            <p className="text-2xl font-bold">{done}</p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-xs text-gray-500">Promedio general</p>
            <p className="text-2xl font-bold">{avgScore.toFixed(1)}</p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-xs text-gray-500">% completado</p>
            <p className="text-2xl font-bold">{total > 0 ? Math.round((done / total) * 100) : 0}%</p>
          </div>
        </div>

        {/* Per-exercise stats */}
        {exStats.length > 0 && (
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b"><p className="font-medium text-sm">Promedio por ejercicio</p></div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-2 text-left">Ejercicio</th>
                    <th className="px-4 py-2 text-left">Promedio</th>
                    <th className="px-4 py-2 text-left">Pregunta más baja</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {exStats.map(ex => (
                    <tr key={ex.id}>
                      <td className="px-4 py-2 font-medium">{ex.id}: {ex.title}</td>
                      <td className="px-4 py-2">
                        <span className="font-mono">{ex.avg?.toFixed(2)}</span>
                        <span className="text-gray-400 text-xs"> / {ex.total_points}</span>
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-500">
                        {ex.worstQ != null
                          ? `Q${ex.worstQ}: ${Math.round(ex.worstPct * 100)}% promedio`
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Buscar alumno o RUT…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm w-52"
          />
          <select
            value={filterEx}
            onChange={e => setFilterEx(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm"
          >
            <option value="all">Todos los ejercicios</option>
            {exercises.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.id}: {ex.title}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm"
          >
            <option value="all">Todos los estados</option>
            <option value="done">Revisados</option>
            <option value="in_progress">En progreso</option>
            <option value="pending">Pendientes</option>
            <option value="unassigned">Sin asignar</option>
          </select>
          <span className="text-sm text-gray-500">{filtered.length} resultados</span>
        </div>

        {/* Table */}
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Alumno</th>
                  <th className="px-4 py-3 text-left">RUT</th>
                  <th className="px-4 py-3 text-left">Ejercicio</th>
                  <th className="px-4 py-3 text-left">Nota</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Corrector</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(s => {
                  const ex = exercises.find(e => e.id === s.exercise_id)
                  const assignee = profiles.find(p => p.id === s.assigned_to)
                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">
                        {s.student_apellido}, {s.student_nombre}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs">{s.student_rut.toUpperCase()}</td>
                      <td className="px-4 py-2">{s.exercise_id}</td>
                      <td className="px-4 py-2">
                        {s.total_score != null
                          ? <span className="font-mono">{s.total_score}/{ex?.total_points ?? '?'}</span>
                          : <span className="text-gray-300">-</span>}
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant={
                          s.status === 'done' ? 'default' :
                          s.status === 'in_progress' ? 'secondary' : 'outline'
                        } className={`text-xs ${s.status === 'done' ? 'bg-green-600' : ''}`}>
                          {s.status === 'done' ? '✓ Revisado' :
                           s.status === 'in_progress' ? 'En progreso' :
                           s.status === 'pending' ? 'Pendiente' : 'Sin asignar'}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-500">{assignee?.name ?? '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
