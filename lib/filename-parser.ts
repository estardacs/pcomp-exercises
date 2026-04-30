export interface ParsedFilename {
  module: string
  exercise: string
  apellido: string
  nombre: string
  rut: string
  rut_last_digit: string  // '0'–'9' | 'K' | '?'
}

function inferModule(exercise: string): string {
  const n = parseInt(exercise.replace(/^E/i, ''), 10)
  if (n <= 5) return 'M01'
  if (n <= 10) return 'M02'
  return 'M03'
}

export function parseFilename(filename: string): ParsedFilename | null {
  // Strip Google Drive "Copia de" prefix, (N) copy suffix, trailing spaces, extension
  const cleaned = filename
    .replace(/^copia de\s+/i, '')
    .replace(/\s*\(\d+\)(?=\.ipynb$)/i, '')
    .replace(/\.ipynb$/i, '')
    .trim()

  const segments = cleaned.split(/[_\s]+/).filter(Boolean)

  let module = ''
  let exercise = ''
  let rut = ''
  const nameSegs: string[] = []
  let prevSegWasRut = false

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]

    if (/^M\d+$/i.test(seg)) {
      module = seg.toUpperCase()
      prevSegWasRut = false
    } else if (/^E\d+[ab]?$/i.test(seg)) {
      // Normalize E1 → E01, E2 → E02, etc.
      const raw = seg.toUpperCase()
      const letter = raw.match(/^E/i)![0].toUpperCase()
      const digits = raw.slice(1).replace(/^(\d)([ab]?)$/i, '0$1$2')
      exercise = letter + digits
      prevSegWasRut = false
    } else if (/^\d{7,9}[kK]?(?:-\d+)?$/.test(seg)) {
      // Chilean RUT: 7–9 digits + optional K, optional -N copy suffix
      rut = seg.replace(/-\d+$/, '').toLowerCase()
      prevSegWasRut = true
    } else if (/^[kK]$/.test(seg) && prevSegWasRut) {
      // Lone "K" right after a RUT number → check digit (e.g. "21031041_K")
      rut = rut + 'k'
      prevSegWasRut = false
    } else if (/^[a-záéíóúüñ]{2,}(?:-[a-záéíóúüñ]+)*$/i.test(seg)) {
      nameSegs.push(seg)
      prevSegWasRut = false
    } else {
      prevSegWasRut = false
    }
  }

  if (!exercise || nameSegs.length < 1) return null

  // When there are more than 2 name segments, extra title words (e.g. "Python",
  // "Introduccion", "PRINT", "SUMAR") always appear BEFORE the student's real name.
  // Take the last 2 segments as apellido/nombre.
  const apellido = capitalize(nameSegs.at(-2) ?? nameSegs[0])
  const nombre   = nameSegs.length >= 2 ? capitalize(nameSegs.at(-1)!) : ''

  if (!module) module = inferModule(exercise)

  const lastChar = rut ? rut.slice(-1).toUpperCase() : '?'
  const rut_last_digit = lastChar === 'K' ? 'K' : (rut ? lastChar : '?')

  return { module, exercise, apellido, nombre, rut, rut_last_digit }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

export function rutDigitToIndex(digit: string): string {
  return digit === 'K' ? '10' : digit
}
