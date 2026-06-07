/** Normaliza RUT a formato 12345678-9 o 12345678-K */
export function normalizeRut(rut: string): string {
  const cleaned = rut.trim().toUpperCase().replace(/\./g, '').replace(/\s/g, '')
  if (cleaned.includes('-')) return cleaned
  if (cleaned.length < 2) return cleaned
  return `${cleaned.slice(0, -1)}-${cleaned.slice(-1)}`
}

/**
 * RUT en el formato usado por `submissions.student_rut` (derivado del nombre de
 * archivo): dígitos + verificador, sin puntos ni guión, en minúscula.
 * Las políticas RLS comparan `profiles.rut` con `submissions.student_rut`, así
 * que ambos deben guardarse con este formato.
 */
export function toSubmissionRut(rut: string): string {
  return rut.trim().toLowerCase().replace(/[.\-\s]/g, '')
}

/** Último dígito del RUT ('0'–'9' | 'K' | '?') para el indexado por RUT. */
export function rutLastDigit(rut: string): string {
  const cleaned = toSubmissionRut(rut)
  if (!cleaned) return '?'
  const last = cleaned.slice(-1).toUpperCase()
  return last === 'K' ? 'K' : last
}
