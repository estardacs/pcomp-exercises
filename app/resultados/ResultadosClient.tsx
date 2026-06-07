'use client'

import { useState, useMemo } from 'react'
import type { Submission, QuestionGrade } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { scoreToNota, formatNotaChilena } from '@/lib/grade-converter'

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

  // Stats — only graded submissions
  const total = submissions.length
  const done = submissions.filter(s => s.status === 'done').length
  const gradedSubs = submissions.filter(s => s.status === 'done' && s.total_score != null)
  const notas = gradedSubs.map(s => {
    const ex = exercises.find(e => e.id === s.exercise_id)
    return scoreToNota(s.total_score ?? 0, ex?.total_points ?? 6)
  })
  const avgNota = notas.length > 0 ? notas.reduce((a, b) => a + b, 0) / notas.length : null
  const pctAprobados = notas.length > 0
    ? Math.round((notas.filter(n => n >= 4).length / notas.length) * 100)
    : null

  interface ExStat {
    id: string; title: string; total_points: number
    avgNota: number; pctAprob: number; worstQ: number | null; worstPct: number; count: number
  }

  // Per-exercise averages (nota scale)
  const exStats: ExStat[] = exercises.flatMap(ex => {
    const exSubs = submissions.filter(s => s.exercise_id === ex.id && s.status === 'done' && s.total_score != null)
    if (exSubs.length === 0) return []
    const exNotas = exSubs.map(s => scoreToNota(s.total_score ?? 0, ex.total_points || 6))
    const avgN = exNotas.reduce((a, b) => a + b, 0) / exNotas.length
    const pctAprob = Math.round((exNotas.filter(n => n >= 4).length / exNotas.length) * 100)
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
    let worstQ: number | null = null
    let worstPct = 1
    Object.entries(byQ).forEach(([qn, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length
      if (avg < worstPct) { worstPct = avg; worstQ = parseInt(qn) }
    })
    return [{ id: ex.id, title: ex.title, total_points: ex.total_points, avgNota: avgN, pctAprob, worstQ, worstPct, count: exSubs.length }]
  })

  function exportExcel() {
    const params = new URLSearchParams({
      ex: filterEx,
      status: filterStatus,
      ...(search ? { q: search } : {}),
    })
    window.location.href = `/api/resultados/export?${params}`
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-8 space-y-6 animate-in fade-in-0 duration-200">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Resultados</h1>
          <Button size="sm" onClick={exportExcel}>Exportar Excel</Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border rounded-lg p-4">
            <p className="text-xs text-gray-500">Total alumnos</p>
            <p className="text-2xl font-bold">{total}</p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-xs text-gray-500">Revisados</p>
            <p className="text-2xl font-bold">{done}</p>
            <p className="text-xs text-gray-400">{total > 0 ? Math.round((done / total) * 100) : 0}% del total</p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-xs text-gray-500">Nota promedio</p>
            <p className={`text-2xl font-bold ${avgNota != null && avgNota >= 4 ? 'text-green-600' : avgNota != null ? 'text-red-600' : ''}`}>
              {avgNota != null ? formatNotaChilena(avgNota) : '-'}
            </p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-xs text-gray-500">Tasa aprobacion</p>
            <p className={`text-2xl font-bold ${pctAprobados != null && pctAprobados >= 60 ? 'text-green-600' : pctAprobados != null ? 'text-amber-600' : ''}`}>
              {pctAprobados != null ? `${pctAprobados}%` : '-'}
            </p>
            <p className="text-xs text-gray-400">nota &ge; 4,0</p>
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
                    <th className="px-4 py-2 text-left">Nota prom.</th>
                    <th className="px-4 py-2 text-left">% Aprobados</th>
                    <th className="px-4 py-2 text-left">Revisados</th>
                    <th className="px-4 py-2 text-left">Pregunta mas baja</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {exStats.map(ex => (
                    <tr key={ex.id}>
                      <td className="px-4 py-2 font-medium">{ex.id}: {ex.title}</td>
                      <td className="px-4 py-2">
                        <span className={`font-bold ${ex.avgNota >= 4 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatNotaChilena(ex.avgNota)}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span className={ex.pctAprob >= 60 ? 'text-green-600' : 'text-amber-600'}>
                          {ex.pctAprob}%
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-500">{ex.count}</td>
                      <td className="px-4 py-2 text-xs text-gray-500">
                        {ex.worstQ != null
                          ? `P${ex.worstQ}: ${Math.round(ex.worstPct * 100)}%`
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
                  <th className="px-4 py-3 text-left">Puntaje</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Corrector</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(s => {
                  const ex = exercises.find(e => e.id === s.exercise_id)
                  const assignee = profiles.find(p => p.id === s.assigned_to)
                  const nota = s.total_score != null
                    ? scoreToNota(s.total_score, ex?.total_points ?? 6)
                    : null
                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">
                        {s.student_apellido}, {s.student_nombre}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs">{s.student_rut.toUpperCase()}</td>
                      <td className="px-4 py-2">{s.exercise_id}</td>
                      <td className="px-4 py-2">
                        {nota != null
                          ? <span className={`font-bold ${nota >= 4 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatNotaChilena(nota)}
                            </span>
                          : <span className="text-gray-300">-</span>}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs text-gray-400">
                        {s.total_score != null ? `${s.total_score}/${ex?.total_points ?? '?'}` : '-'}
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
  )
}
