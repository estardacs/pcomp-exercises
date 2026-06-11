import { type NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { requireGraderApi } from '@/lib/auth'
import { scoreToNota } from '@/lib/grade-converter'
import type { Submission, QuestionGrade } from '@/types/database'

// --- Style constants ---
const UC_BLUE  = 'FF1B4B8A'
const WHITE    = 'FFFFFFFF'
const GREEN_FG = 'FF15803D'   // text: nota aprobada
const RED_FG   = 'FFB91C1C'   // text: nota reprobada
const GREEN_BG = 'FFD1FAE5'   // bg suave verde
const RED_BG   = 'FFFEE2E2'   // bg suave rojo
const ROW_ALT  = 'FFF8FAFC'   // alternating row
const BORDER_COLOR = 'FFD1D5DB'

const thin = (color = BORDER_COLOR): ExcelJS.Border => ({ style: 'thin', color: { argb: color } })
const hair = (): ExcelJS.Border => ({ style: 'hair', color: { argb: BORDER_COLOR } })

function styleHeader(row: ExcelJS.Row, cols: number) {
  row.height = 30
  for (let c = 1; c <= cols; c++) {
    const cell = row.getCell(c)
    cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: UC_BLUE } }
    cell.font  = { bold: true, color: { argb: WHITE }, size: 11, name: 'Calibri' }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false }
    cell.border = { top: thin(), bottom: thin(), left: thin(), right: thin() }
  }
}

function styleDataRow(row: ExcelJS.Row, cols: number, even: boolean) {
  row.height = 18
  for (let c = 1; c <= cols; c++) {
    const cell = row.getCell(c)
    if (even) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ROW_ALT } }
    cell.border = { top: hair(), bottom: hair(), left: hair(), right: hair() }
    cell.alignment = { vertical: 'middle' }
    cell.font = { name: 'Calibri', size: 10 }
  }
}

function colorNota(cell: ExcelJS.Cell, nota: number) {
  const pass = nota >= 4
  cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: pass ? GREEN_BG : RED_BG } }
  cell.font  = { bold: true, color: { argb: pass ? GREEN_FG : RED_FG }, name: 'Calibri', size: 10 }
  cell.alignment = { vertical: 'middle', horizontal: 'center' }
  cell.border = { top: hair(), bottom: hair(), left: hair(), right: hair() }
}

// GET /api/resultados/export?ex=all&status=all&q=
export async function GET(request: NextRequest) {
  const auth = await requireGraderApi()
  if ('error' in auth) return auth.error

  const { supabase } = auth
  const { searchParams } = new URL(request.url)
  const filterEx     = searchParams.get('ex')     ?? 'all'
  const filterStatus = searchParams.get('status') ?? 'all'
  const filterQ      = (searchParams.get('q') ?? '').toLowerCase()

  // Fetch all data in parallel
  const [subRes, exRes, gradesRes, profRes] = await Promise.all([
    supabase.from('submissions').select('*').order('student_apellido') as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    supabase.from('exercises').select('id, title, module, total_points').order('id') as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    supabase.from('question_grades').select('submission_id, question_n, score, max_points') as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    supabase.from('profiles').select('id, name').in('role', ['profesor', 'ayudante']) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
  ])

  const allSubs     = (subRes.data    ?? []) as Submission[]
  const exercises   = (exRes.data     ?? []) as Array<{ id: string; title: string; module: string; total_points: number }>
  const allGrades   = (gradesRes.data ?? []) as Array<Pick<QuestionGrade, 'submission_id' | 'question_n' | 'score' | 'max_points'>>
  const profiles    = (profRes.data   ?? []) as Array<{ id: string; name: string }>

  // Apply filters
  const subs = allSubs.filter(s => {
    if (filterEx !== 'all' && s.exercise_id !== filterEx) return false
    if (filterStatus !== 'all' && s.status !== filterStatus) return false
    if (filterQ) {
      const hay = `${s.student_apellido} ${s.student_nombre} ${s.student_rut}`.toLowerCase()
      if (!hay.includes(filterQ)) return false
    }
    return true
  })

  // --- Build workbook ---
  const wb = new ExcelJS.Workbook()
  wb.creator  = 'DNO1063'
  wb.created  = new Date()
  wb.modified = new Date()

  // ================================================================
  // Sheet 1: Resultados (tabla principal)
  // ================================================================
  const ws = wb.addWorksheet('Resultados', {
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
    headerFooter: {
      oddHeader: '&C&B Resultados DNO1063 &D',
      oddFooter: '&C Pagina &P de &N',
    },
  })

  // Title row
  ws.mergeCells('A1:J1')
  const titleCell = ws.getCell('A1')
  titleCell.value     = `Resultados DNO1063 — ${new Date().toLocaleDateString('es-CL')}`
  titleCell.font      = { bold: true, size: 13, color: { argb: UC_BLUE }, name: 'Calibri' }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(1).height = 28

  // Sub-title row: filter info
  ws.mergeCells('A2:J2')
  const subtitleParts = [
    filterEx !== 'all' ? `Ejercicio: ${filterEx}` : 'Todos los ejercicios',
    filterStatus !== 'all' ? `Estado: ${filterStatus}` : null,
    filterQ ? `Busqueda: "${filterQ}"` : null,
    `${subs.length} registros`,
  ].filter(Boolean)
  const subtitleCell   = ws.getCell('A2')
  subtitleCell.value   = subtitleParts.join('  ·  ')
  subtitleCell.font    = { italic: true, size: 9, color: { argb: 'FF6B7280' }, name: 'Calibri' }
  subtitleCell.alignment = { horizontal: 'center' }
  ws.getRow(2).height  = 16

  ws.getRow(3).height = 6 // spacer

  // Column definitions
  ws.columns = [
    { key: 'apellido',  width: 22 },
    { key: 'nombre',    width: 22 },
    { key: 'rut',       width: 13 },
    { key: 'ejercicio', width: 11 },
    { key: 'nota',      width: 9  },
    { key: 'puntaje',   width: 10 },
    { key: 'max',       width: 7  },
    { key: 'estado',    width: 15 },
    { key: 'corrector', width: 22 },
    { key: 'comentario',width: 45 },
  ]

  // Header row (row 4)
  const headerRow = ws.addRow([
    'Apellido', 'Nombre', 'RUT', 'Ejercicio',
    'Nota', 'Puntaje', 'Max', 'Estado', 'Corrector', 'Comentario',
  ])
  styleHeader(headerRow, 10)

  // Data rows (from row 5)
  subs.forEach((s, idx) => {
    const ex       = exercises.find(e => e.id === s.exercise_id)
    const assignee = profiles.find(p => p.id === s.assigned_to)
    const nota     = s.total_score != null
      ? scoreToNota(s.total_score, ex?.total_points ?? 6)
      : null
    const estadoLabel = s.status === 'done' ? 'Revisado' :
                        s.status === 'in_progress' ? 'En progreso' :
                        s.status === 'pending' ? 'Pendiente' : 'Sin asignar'

    const row = ws.addRow([
      s.student_apellido,
      s.student_nombre,
      s.student_rut.toUpperCase(),
      s.exercise_id,
      nota,                         // numeric — Excel formats with locale decimal separator
      s.total_score ?? '',
      ex?.total_points ?? '',
      estadoLabel,
      assignee?.name ?? '',
      s.general_comment ?? '',
    ])

    styleDataRow(row, 10, idx % 2 === 0)

    // Nota cell: color override
    if (nota != null) {
      colorNota(row.getCell(5), nota)
    }

    // RUT: monospace center
    row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' }
    row.getCell(3).font = { name: 'Courier New', size: 9 }

    // Ejercicio: center
    row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' }

    // Puntaje / Max: center
    row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' }
    row.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' }

    // Comentario: wrap text
    row.getCell(10).alignment = { wrapText: true, vertical: 'top' }
  })

  // Freeze rows 1-4 (title + header), autofilter on header
  ws.views = [{ state: 'frozen', ySplit: 4, xSplit: 0 }]
  ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: 10 } }

  // ================================================================
  // Sheet 2: Por ejercicio
  // ================================================================
  const ws2 = wb.addWorksheet('Por ejercicio')

  ws2.mergeCells('A1:F1')
  const t2 = ws2.getCell('A1')
  t2.value     = 'Resumen por ejercicio'
  t2.font      = { bold: true, size: 13, color: { argb: UC_BLUE }, name: 'Calibri' }
  t2.alignment = { horizontal: 'center', vertical: 'middle' }
  ws2.getRow(1).height = 28
  ws2.getRow(2).height = 6

  ws2.columns = [
    { key: 'id',      width: 11 },
    { key: 'titulo',  width: 30 },
    { key: 'nota',    width: 12 },
    { key: 'pct',     width: 14 },
    { key: 'rev',     width: 11 },
    { key: 'baja',    width: 20 },
  ]

  const h2 = ws2.addRow(['Ejercicio', 'Titulo', 'Nota prom.', '% Aprobados', 'Revisados', 'Pregunta mas baja'])
  styleHeader(h2, 6)

  let exRowIdx = 0
  exercises.forEach((ex) => {
    const exSubs = allSubs.filter(s => s.exercise_id === ex.id && s.status === 'done' && s.total_score != null)
    if (exSubs.length === 0) return

    const exNotas = exSubs.map(s => scoreToNota(s.total_score ?? 0, ex.total_points || 6))
    const avgN    = exNotas.reduce((a, b) => a + b, 0) / exNotas.length
    const pctAp   = Math.round((exNotas.filter(n => n >= 4).length / exNotas.length) * 100)

    const exGrades = allGrades.filter(g => allSubs.find(s => s.id === g.submission_id && s.exercise_id === ex.id))
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
      const a = scores.reduce((x, y) => x + y, 0) / scores.length
      if (a < worstPct) { worstPct = a; worstQ = parseInt(qn) }
    })
    const bajaStr = worstQ != null ? `P${worstQ}: ${Math.round(worstPct * 100)}%` : '-'

    const row = ws2.addRow([ex.id, ex.title, avgN, pctAp / 100, exSubs.length, bajaStr])
    styleDataRow(row, 6, exRowIdx % 2 === 0)
    exRowIdx++

    // Nota promedio color
    colorNota(row.getCell(3), avgN)

    // % Aprobados: percentage format
    const pctCell = row.getCell(4)
    pctCell.numFmt = '0%'
    pctCell.alignment = { horizontal: 'center', vertical: 'middle' }
    pctCell.font = {
      bold: true,
      color: { argb: pctAp >= 60 ? GREEN_FG : RED_FG },
      name: 'Calibri', size: 10,
    }

    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
    row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' }
  })

  ws2.views = [{ state: 'frozen', ySplit: 3 }]

  // ================================================================
  // Sheet 3: Resumen general
  // ================================================================
  const ws3 = wb.addWorksheet('Resumen')

  const addStatBlock = (row: number, label: string, value: string | number, isGood?: boolean) => {
    const lCell  = ws3.getCell(row, 1)
    const vCell  = ws3.getCell(row, 2)
    lCell.value  = label
    vCell.value  = value
    lCell.font   = { name: 'Calibri', size: 11, color: { argb: 'FF374151' } }
    vCell.font   = {
      bold: true, size: 14, name: 'Calibri',
      color: { argb: isGood === undefined ? UC_BLUE : isGood ? GREEN_FG : RED_FG },
    }
    vCell.alignment = { horizontal: 'left', vertical: 'middle' }
    ws3.getRow(row).height = 24
  }

  ws3.getColumn(1).width = 26
  ws3.getColumn(2).width = 16

  ws3.mergeCells('A1:B1')
  const t3 = ws3.getCell('A1')
  t3.value     = 'Resumen DNO1063'
  t3.font      = { bold: true, size: 15, color: { argb: UC_BLUE }, name: 'Calibri' }
  t3.alignment = { horizontal: 'center', vertical: 'middle' }
  ws3.getRow(1).height = 36
  ws3.getRow(2).height = 8

  const gradedSubs  = allSubs.filter(s => s.status === 'done' && s.total_score != null)
  const allNotas    = gradedSubs.map(s => {
    const ex = exercises.find(e => e.id === s.exercise_id)
    return scoreToNota(s.total_score ?? 0, ex?.total_points ?? 6)
  })
  const avgNota     = allNotas.length ? allNotas.reduce((a, b) => a + b, 0) / allNotas.length : null
  const pctAprobGen = allNotas.length ? Math.round((allNotas.filter(n => n >= 4).length / allNotas.length) * 100) : null
  const pctRevisado = allSubs.length ? Math.round((gradedSubs.length / allSubs.length) * 100) : 0

  addStatBlock(3, 'Total entregas',      allSubs.length)
  addStatBlock(4, 'Revisadas',           `${gradedSubs.length} (${pctRevisado}%)`)
  addStatBlock(5, 'Nota promedio',       avgNota != null ? +avgNota.toFixed(2) : 'Sin datos',
    avgNota != null ? avgNota >= 4 : undefined)
  addStatBlock(6, 'Tasa de aprobacion', pctAprobGen != null ? `${pctAprobGen}%` : 'Sin datos',
    pctAprobGen != null ? pctAprobGen >= 60 : undefined)
  addStatBlock(7, 'Ejercicios activos',  exercises.length)
  addStatBlock(9, 'Generado el',
    new Date().toLocaleString('es-CL', { dateStyle: 'long', timeStyle: 'short' }))

  // --- Serialize and return ---
  const buffer = await wb.xlsx.writeBuffer()

  const filename = `resultados_dno1063_${new Date().toISOString().slice(0, 10)}.xlsx`

  return new NextResponse(new Uint8Array(buffer as ArrayBuffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
