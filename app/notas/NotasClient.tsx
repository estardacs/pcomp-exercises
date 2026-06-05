'use client'

import { useMemo } from 'react'
import type { GradesSheetData } from '@/lib/grades-sheet-types'
import { normalizeRut } from '@/lib/rut-utils'
import type { Submission } from '@/types/database'

interface Props {
  sheet: GradesSheetData
  synced: Pick<Submission, 'student_rut' | 'exercise_id' | 'nota_synced_at' | 'total_score'>[]
}

const EXERCISE_IDS = Array.from({ length: 13 }, (_, i) => `E${String(i + 1).padStart(2, '0')}`)

export default function NotasClient({ sheet, synced }: Props) {
  const { headerRow, studentRows } = sheet

  const syncedSet = useMemo(() => {
    const set = new Set<string>()
    for (const s of synced) {
      set.add(`${normalizeRut(s.student_rut)}|${s.exercise_id.toUpperCase()}`)
    }
    return set
  }, [synced])

  const displayColumns = useMemo(() => {
    const cols: Array<{ index: number; label: string }> = [
      { index: 0, label: 'N°' },
      { index: 1, label: 'RUT' },
      { index: 2, label: 'Ap. Paterno' },
      { index: 3, label: 'Ap. Materno' },
      { index: 4, label: 'Nombres' },
    ]
    for (const exId of EXERCISE_IDS) {
      const idx = headerRow.findIndex(h => h?.trim().toUpperCase() === exId)
      if (idx >= 0) cols.push({ index: idx, label: exId })
    }
    const promedioIdx = headerRow.findIndex(h => h?.trim().toUpperCase() === 'PROMEDIO')
    if (promedioIdx >= 0) {
      cols.push({ index: promedioIdx, label: 'Prom. Ej.' })
      const notaCell = headerRow[promedioIdx + 1]?.trim().toUpperCase()
      if (notaCell === 'NOTA') cols.push({ index: promedioIdx + 1, label: 'Nota Ej.' })
    }
    return cols
  }, [headerRow])

  function isRecentlySynced(rut: string, colLabel: string): boolean {
    if (!EXERCISE_IDS.includes(colLabel)) return false
    return syncedSet.has(`${normalizeRut(rut)}|${colLabel}`)
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {studentRows.length} estudiantes · columnas E01–E13 resaltadas al sincronizar desde el corrector
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              {displayColumns.map(col => (
                <th
                  key={col.index}
                  className={`px-3 py-2 text-left font-medium text-gray-600 whitespace-nowrap ${
                    EXERCISE_IDS.includes(col.label) ? 'bg-blue-50' : ''
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {studentRows.map(({ cells }, i) => {
              const rut = cells[1] ?? ''
              return (
                <tr key={i} className="border-b hover:bg-gray-50">
                  {displayColumns.map(col => {
                    const value = cells[col.index] ?? ''
                    const highlighted = isRecentlySynced(rut, col.label)
                    return (
                      <td
                        key={col.index}
                        className={`px-3 py-1.5 whitespace-nowrap ${
                          EXERCISE_IDS.includes(col.label) ? 'bg-blue-50/30 font-mono text-center' : ''
                        } ${highlighted ? 'ring-2 ring-inset ring-green-400 bg-green-50' : ''}`}
                      >
                        {value || '—'}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
