import type { NotebookJson, ParsedCell, ParsedQuestion, CellOutput } from '@/types/database'

interface RawOutput {
  output_type: string
  name?: string           // 'stdout' | 'stderr'
  text?: string | string[]
  data?: Record<string, string | string[]>
  ename?: string
  evalue?: string
}

interface RawCell {
  cell_type: 'code' | 'markdown'
  source: string | string[]
  outputs?: RawOutput[]
}

interface RawNotebook {
  cells: RawCell[]
}

// Separator: first line of the cell starts with "## Ahora Usted"
const SEPARATOR_FIRST_LINE_RE = /^#{1,3}\s*Ahora Usted/i

// Question heading variant 1: coded number/letter + dash
// Matches: "## A1- Title", "## 1B- Title", "## 1 - Title", "### A - Title (2 puntos)"
const QUESTION_NUMBERED_RE = /^#{1,4}\s*(?:[A-Za-z]?\d+[A-Za-z]?|[A-Za-z]\d*)\s*[-–]\s*(.+?)(?:\s*\(([0-9.]+)\s*puntos?\))?\s*[.:]?\s*$/i

// Question heading variant 2: any heading that explicitly declares points
// Matches: "## Parte C de la tarea: Concatenar una frase (2 puntos)."
const QUESTION_WITH_POINTS_RE = /^#{1,4}\s*(.+?)\s*\(([0-9.]+)\s*puntos?\)\s*[.:]?\s*$/i

const PLACEHOLDER_RE = /^#\s*Su respuesta desde ac[aá]\.?\s*$/i

function joinSource(source: string | string[]): string {
  return Array.isArray(source) ? source.join('') : source
}

function isSeparator(cell: RawCell): boolean {
  const firstLine = joinSource(cell.source).split('\n')[0].trim()
  return cell.cell_type === 'markdown' && SEPARATOR_FIRST_LINE_RE.test(firstLine)
}

function isPlaceholder(source: string): boolean {
  return PLACEHOLDER_RE.test(source.trim())
}

function extractOutputs(rawOutputs?: RawOutput[]): CellOutput[] | undefined {
  if (!rawOutputs?.length) return undefined
  const results: CellOutput[] = []
  for (const o of rawOutputs) {
    if (o.output_type === 'stream') {
      const text = Array.isArray(o.text) ? o.text.join('') : (o.text ?? '')
      if (text.trim()) results.push({ kind: 'text', text })
    } else if (o.output_type === 'display_data' || o.output_type === 'execute_result') {
      const png = o.data?.['image/png']
      if (png) {
        results.push({ kind: 'image', image: Array.isArray(png) ? png.join('') : png })
      } else {
        const plain = o.data?.['text/plain']
        if (plain) {
          const text = Array.isArray(plain) ? plain.join('') : plain
          if (text.trim()) results.push({ kind: 'text', text })
        }
      }
    } else if (o.output_type === 'error') {
      results.push({ kind: 'error', text: `${o.ename}: ${o.evalue}` })
    }
  }
  return results.length ? results : undefined
}

function matchQuestionHeading(src: string): { title: string; maxPoints: number } | null {
  // Only check the first line - cells may have explanatory text after the heading
  const trimmed = src.split('\n')[0].trim()
  // Try numbered/lettered format first (A1-, 1B-, 1-, A-)
  const numbered = trimmed.match(QUESTION_NUMBERED_RE)
  if (numbered) {
    return {
      title: numbered[1].trim().replace(/\.$/, ''),
      maxPoints: numbered[2] ? parseFloat(numbered[2]) : 1,
    }
  }
  // Try any heading with explicit points
  const withPoints = trimmed.match(QUESTION_WITH_POINTS_RE)
  if (withPoints) {
    return {
      title: withPoints[1].trim().replace(/\.$/, ''),
      maxPoints: parseFloat(withPoints[2]),
    }
  }
  return null
}

export function parseNotebook(raw: unknown): NotebookJson {
  const nb = raw as RawNotebook
  if (!nb?.cells?.length) return { questions: [], raw_cells: [] }

  const raw_cells: ParsedCell[] = nb.cells.map(c => ({
    type: c.cell_type,
    source: joinSource(c.source),
    is_placeholder: c.cell_type === 'code' && isPlaceholder(joinSource(c.source)),
    outputs: extractOutputs(c.outputs),
  }))

  // Find separator (check first line of each markdown cell)
  let separatorIdx = -1
  for (let i = 0; i < nb.cells.length; i++) {
    if (isSeparator(nb.cells[i])) {
      separatorIdx = i
      break
    }
  }

  if (separatorIdx === -1) {
    return { questions: [], raw_cells }
  }

  const afterSep = nb.cells.slice(separatorIdx + 1)
  const questions: ParsedQuestion[] = []
  let currentQuestion: ParsedQuestion | null = null

  for (const cell of afterSep) {
    const src = joinSource(cell.source)
    const trimmed = src.trim()

    if (cell.cell_type === 'markdown') {
      const match = matchQuestionHeading(trimmed)
      if (match) {
        if (currentQuestion) questions.push(currentQuestion)
        currentQuestion = {
          n: questions.length + 1,
          title: match.title,
          max_points: match.maxPoints,
          cells: [],
          is_empty: true,
        }
        continue
      }
    }

    if (currentQuestion) {
      const isPlaceholderCell = cell.cell_type === 'code' && isPlaceholder(src)
      currentQuestion.cells.push({
        type: cell.cell_type,
        source: src,
        is_placeholder: isPlaceholderCell,
        outputs: extractOutputs(cell.outputs),
      })
      if (cell.cell_type === 'code' && !isPlaceholderCell && trimmed.length > 0) {
        currentQuestion.is_empty = false
      }
    }
  }

  if (currentQuestion) questions.push(currentQuestion)

  return { questions, raw_cells }
}
