/** Normaliza RUT a formato 12345678-9 o 12345678-K */
export function normalizeRut(rut: string): string {
  const cleaned = rut.trim().toUpperCase().replace(/\./g, '').replace(/\s/g, '')
  if (cleaned.includes('-')) return cleaned
  if (cleaned.length < 2) return cleaned
  return `${cleaned.slice(0, -1)}-${cleaned.slice(-1)}`
}
