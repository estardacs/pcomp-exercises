'use client'

import { useState } from 'react'
import type { SubmissionWithGrades, QuestionGrade } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

interface Props {
  submissions: SubmissionWithGrades[]
  gradesMap: Record<string, QuestionGrade[]>
  currentId: string
  onSelect: (id: string) => void
  maxTotal: number
  userId: string
}

export default function StudentSidebar({ submissions, gradesMap, currentId, onSelect, maxTotal, userId }: Props) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all')

  const filtered = submissions.filter(s => {
    const name = `${s.student_apellido} ${s.student_nombre}`.toLowerCase()
    const matchesSearch = name.includes(search.toLowerCase())
    const matchesFilter =
      filter === 'all' ||
      (filter === 'done' && s.status === 'done') ||
      (filter === 'pending' && s.status !== 'done')
    return matchesSearch && matchesFilter
  })

  const done = submissions.filter(s => s.status === 'done').length

  return (
    <div className="w-56 bg-white border-r flex flex-col h-full shrink-0">
      <div className="p-3 border-b space-y-2">
        <Input
          placeholder="Buscar…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-8 text-sm"
        />
        <div className="flex gap-1">
          {(['all', 'pending', 'done'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 text-xs py-1 rounded transition-colors ${
                filter === f ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendientes' : 'Listos'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.map(sub => {
          const grades = gradesMap[sub.id] ?? []
          const total = grades.reduce((s, g) => s + (g.score ?? 0), 0)
          const answered = grades.filter(g => g.score != null).length
          const emptyCount = sub.notebook_json?.questions?.filter(q => q.is_empty).length ?? 0
          const isCurrent = sub.id === currentId
          const isMine = sub.assigned_to === userId

          return (
            <button
              key={sub.id}
              onClick={() => onSelect(sub.id)}
              className={`w-full text-left px-3 py-2.5 border-b transition-colors ${
                isCurrent
                  ? 'bg-blue-50 border-l-2 border-l-blue-500'
                  : isMine
                    ? 'hover:bg-gray-50 border-l-2 border-l-transparent'
                    : 'hover:bg-gray-50 border-l-2 border-l-transparent opacity-50'
              }`}
            >
              <div className="flex items-start justify-between gap-1">
                <span className={`text-sm leading-tight ${isCurrent ? 'font-semibold text-blue-700' : 'font-medium'}`}>
                  {sub.student_apellido}, {sub.student_nombre.split(' ')[0]}
                </span>
                {sub.status === 'done' ? (
                  <Badge className="bg-green-600 text-white text-xs px-1 py-0 shrink-0">✓</Badge>
                ) : emptyCount > 0 ? (
                  <Badge variant="destructive" className="text-xs px-1 py-0 shrink-0">⚠</Badge>
                ) : null}
              </div>
              <div className="mt-0.5">
                {answered > 0
                  ? <span className="text-xs text-gray-500">{total}/{maxTotal} pt</span>
                  : <span className="text-xs text-gray-300">sin nota</span>
                }
              </div>
            </button>
          )
        })}
      </div>

      <div className="p-3 border-t text-xs text-gray-500 text-center">
        {done}/{submissions.length} revisados
      </div>
    </div>
  )
}
