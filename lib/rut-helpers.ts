import type { RubricQuestion } from '@/types/database'
import { rutDigitToIndex } from './filename-parser'

export function resolveExpectedOutput(
  question: RubricQuestion,
  rutLastDigit: string,
  studentName: string
): string | null {
  if (!question.rut_indexed || !question.rut_map) return null

  const idx = rutDigitToIndex(rutLastDigit)
  const selection = question.rut_map[idx] ?? question.rut_map[rutLastDigit]

  if (!selection) return null

  if (!question.expected_template) return selection

  return question.expected_template
    .replace('{nombre}', studentName)
    .replace('{rut_digit}', rutLastDigit === 'K' ? '10' : rutLastDigit)
    .replace('{selection}', selection)
    .replace('{rut_last}', rutLastDigit)
}

export function getExpectedSelection(
  question: RubricQuestion,
  rutLastDigit: string
): string | null {
  if (!question.rut_indexed || !question.rut_map) return null
  const idx = rutDigitToIndex(rutLastDigit)
  return question.rut_map[idx] ?? question.rut_map[rutLastDigit] ?? null
}
