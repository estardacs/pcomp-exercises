import fs from 'fs'
import path from 'path'
import { parseCsv, serializeCsvRow } from './csv-utils'
import { formatNotaChilena } from './grade-converter'
import { normalizeRut } from './rut-utils'
import type { GradesSheetData } from './grades-sheet-types'

export { normalizeRut }
export type { GradesSheetData }

export const GRADES_CSV_PATH = path.join(process.cwd(), 'data', 'notas', 'NOTAS_PCOMP_2026A.csv')

const EXERCISE_COLUMN_START = 5 // E01 is column index 5 (column F)

export function exerciseColumnIndex(exerciseId: string): number | null {
  const match = exerciseId.match(/^E(\d+)$/i)
  if (!match) return null
  const n = parseInt(match[1], 10)
  if (n < 1 || n > 13) return null
  return EXERCISE_COLUMN_START + n - 1
}

export function readGradesSheet(): { rows: string[][]; headerRowIndex: number } {
  const content = fs.readFileSync(GRADES_CSV_PATH, 'utf-8')
  const rows = parseCsv(content)

  const headerRowIndex = rows.findIndex(row =>
    row.some(cell => /^E01$/i.test(cell?.trim() ?? ''))
  )
  if (headerRowIndex === -1) {
    throw new Error('No se encontró fila de encabezados con E01 en el CSV de notas')
  }

  return { rows, headerRowIndex }
}

export function findStudentRow(rows: string[][], headerRowIndex: number, rut: string): number | null {
  const normalized = normalizeRut(rut)
  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const rowRut = rows[i]?.[1]?.trim()
    if (!rowRut) continue
    if (normalizeRut(rowRut) === normalized) return i
  }
  return null
}

export function loadGradesSheetData(): GradesSheetData {
  const { rows, headerRowIndex } = readGradesSheet()
  const sectionRow = headerRowIndex > 0 ? rows[headerRowIndex - 1] : []
  const headerRow = rows[headerRowIndex]
  const studentRows: GradesSheetData['studentRows'] = []

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const cells = rows[i]
    const rut = cells?.[1]?.trim()
    if (!rut || !/^\d{7,9}-[\dK]$/i.test(normalizeRut(rut))) continue
    studentRows.push({ rowIndex: i, cells })
  }

  return { sectionRow, headerRow, studentRows }
}

export function updateExerciseGrade(
  rut: string,
  exerciseId: string,
  nota: number
): { formattedNota: string; rowIndex: number; colIndex: number } {
  const colIndex = exerciseColumnIndex(exerciseId)
  if (colIndex === null) {
    throw new Error(`Ejercicio ${exerciseId} no tiene columna en la hoja de notas`)
  }

  const { rows, headerRowIndex } = readGradesSheet()
  const rowIndex = findStudentRow(rows, headerRowIndex, rut)
  if (rowIndex === null) {
    throw new Error(`RUT ${normalizeRut(rut)} no encontrado en la hoja de notas`)
  }

  const formattedNota = formatNotaChilena(nota)
  while (rows[rowIndex].length <= colIndex) {
    rows[rowIndex].push('')
  }
  rows[rowIndex][colIndex] = formattedNota

  const csvContent = rows.map(serializeCsvRow).join('\n') + '\n'
  fs.writeFileSync(GRADES_CSV_PATH, csvContent, 'utf-8')

  return { formattedNota, rowIndex, colIndex }
}

export function getGradesCsvContent(): string {
  return fs.readFileSync(GRADES_CSV_PATH, 'utf-8')
}
