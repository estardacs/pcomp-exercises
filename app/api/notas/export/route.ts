import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { requireGraderApi } from '@/lib/auth'
import { loadGradesSheetData } from '@/lib/grades-sheet'

const UC_BLUE     = 'FF1B4B8A'
const WHITE       = 'FFFFFFFF'
const GREEN_FG    = 'FF15803D'
const RED_FG      = 'FFB91C1C'
const GREEN_BG    = 'FFD1FAE5'
const RED_BG      = 'FFFEE2E2'
const ROW_ALT     = 'FFF8FAFC'
const BORDER      = 'FFD1D5DB'
const EMPTY_BG    = 'FFF3F4F6'

const thin = (): ExcelJS.Border => ({ style: 'thin',  color: { argb: BORDER } })
const hair = (): ExcelJS.Border => ({ style: 'hair',  color: { argb: BORDER } })
const allBorders = (style: 'thin' | 'hair') => {
  const b = style === 'thin' ? thin() : hair()
  return { top: b, bottom: b, left: b, right: b }
}

// GET /api/notas/export
export async function GET() {
  const auth = await requireGraderApi()
  if ('error' in auth) return auth.error

  const { sectionRow, headerRow, studentRows } = loadGradesSheetData()

  // Detect exercise columns: those whose header matches /^E\d+$/i
  const exColIndices: number[] = []
  headerRow.forEach((h, i) => { if (/^E\d+$/i.test(h?.trim() ?? '')) exColIndices.push(i) })

  const wb = new ExcelJS.Workbook()
  wb.creator  = 'DNO1063'
  wb.created  = new Date()

  const ws = wb.addWorksheet('Notas', {
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
  })

  // --- Column widths ---
  // First 5 columns are metadata (Seccion, RUT, Apellido, Nombre, ...), then one per exercise
  const metaCols = exColIndices.length > 0 ? exColIndices[0] : 5
  const totalCols = headerRow.length

  ws.columns = headerRow.map((h, i) => {
    if (i < metaCols) return { width: i === 0 ? 10 : i === 1 ? 14 : 22 }
    return { width: 10 } // exercise columns
  })

  // --- Row 1: Title ---
  ws.mergeCells(1, 1, 1, totalCols)
  const titleCell = ws.getCell(1, 1)
  titleCell.value     = 'Notas del curso — DNO1063'
  titleCell.font      = { bold: true, size: 14, color: { argb: UC_BLUE }, name: 'Calibri' }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  titleCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4FF' } }
  ws.getRow(1).height = 30

  // --- Row 2: Section info (from sectionRow) ---
  if (sectionRow.some(c => c?.trim())) {
    ws.mergeCells(2, 1, 2, totalCols)
    const secCell       = ws.getCell(2, 1)
    secCell.value       = sectionRow.filter(c => c?.trim()).join('  ·  ')
    secCell.font        = { italic: true, size: 9, color: { argb: 'FF6B7280' }, name: 'Calibri' }
    secCell.alignment   = { horizontal: 'center' }
    ws.getRow(2).height = 16
  }

  ws.getRow(3).height = 6 // spacer

  // --- Row 4: Header ---
  const hRow = ws.addRow(headerRow.map(h => h?.trim() || ''))
  hRow.height = 28
  for (let c = 1; c <= totalCols; c++) {
    const cell = hRow.getCell(c)
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: UC_BLUE } }
    cell.font      = { bold: true, color: { argb: WHITE }, size: 10, name: 'Calibri' }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false }
    cell.border    = allBorders('thin')
  }
  // Left-align name columns
  for (let c = 1; c <= metaCols; c++) {
    hRow.getCell(c).alignment = { vertical: 'middle', horizontal: 'left' }
  }

  // --- Data rows ---
  studentRows.forEach(({ cells }, idx) => {
    const rowData = headerRow.map((_, i) => cells[i]?.trim() ?? '')
    const row = ws.addRow(rowData)
    row.height = 18

    // Base style for all cells
    for (let c = 1; c <= totalCols; c++) {
      const cell = row.getCell(c)
      if (idx % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ROW_ALT } }
      }
      cell.border = allBorders('hair')
      cell.font   = { name: 'Calibri', size: 10 }
      cell.alignment = { vertical: 'middle' }
    }

    // RUT: monospace center
    row.getCell(2).font      = { name: 'Courier New', size: 9 }
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }

    // Exercise columns: color by grade
    exColIndices.forEach(colIdx => {
      const cell  = row.getCell(colIdx + 1) // ExcelJS is 1-based
      const raw   = cells[colIdx]?.trim()
      cell.alignment = { horizontal: 'center', vertical: 'middle' }

      if (!raw) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EMPTY_BG } }
        cell.font = { name: 'Calibri', size: 10, color: { argb: 'FFB0B7C3' } }
        cell.value = '—'
        return
      }

      // Parse Chilean decimal (comma)
      const nota = parseFloat(raw.replace(',', '.'))
      if (!isNaN(nota)) {
        const pass = nota >= 4
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pass ? GREEN_BG : RED_BG } }
        cell.font = { bold: true, name: 'Calibri', size: 10, color: { argb: pass ? GREEN_FG : RED_FG } }
        cell.value = raw // keep original formatted string
      }
    })
  })

  // --- Freeze header, autofilter ---
  ws.views     = [{ state: 'frozen', ySplit: 4, xSplit: 0 }]
  ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: totalCols } }

  const buffer   = await wb.xlsx.writeBuffer()
  const filename = `notas_dno1063_${new Date().toISOString().slice(0, 10)}.xlsx`

  return new NextResponse(buffer as Buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
