/**
 * Convierte puntaje de corrección (sobre maxPoints, típicamente 6) a nota chilena 1.0–7.0.
 * 6/6→7, 5.5/6→6.5, 5/6→6, 4/6→5.5, 3/6→5, 2/6→4, 1/6→3, 0/6→1
 */
export function scoreToNota(totalScore: number, maxPoints: number): number {
  if (maxPoints <= 0) return 1
  const normalized = (totalScore / maxPoints) * 6
  if (normalized >= 6) return 7
  if (normalized >= 5.5) return 6.5
  if (normalized >= 5) return 6
  if (normalized >= 4) return 5.5
  if (normalized >= 3) return 5
  if (normalized >= 2) return 4
  if (normalized >= 1) return 3
  return 1
}

/** Formato chileno para el CSV: enteros sin decimal, medios con coma. */
export function formatNotaChilena(nota: number): string {
  if (nota === Math.floor(nota)) return String(nota)
  return nota.toFixed(1).replace('.', ',')
}
