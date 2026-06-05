'use client'

import { useState } from 'react'
import type { RubricQuestion, QuestionGrade, ParsedQuestion } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import CellOutputView from './CellOutputView'

interface Props {
  rubricQuestion: RubricQuestion
  parsedQuestion: ParsedQuestion | null
  grade: QuestionGrade | null
  expectedOutput: string | null
  onScore: (score: number) => void
  onComment: (comment: string) => void
  onUpdateCriteria?: (n: number, criteria: string) => Promise<void>
  readOnly?: boolean
  compact?: boolean
}

export default function AnswerCard({
  rubricQuestion, parsedQuestion, grade, expectedOutput, onScore, onComment, onUpdateCriteria, readOnly, compact
}: Props) {
  const [showIdeal, setShowIdeal] = useState(false)
  const [comment, setComment] = useState(grade?.comment ?? '')
  const [editingCriteria, setEditingCriteria] = useState(false)
  const [criteriaText, setCriteriaText] = useState(rubricQuestion.criteria)
  const isEmpty = parsedQuestion?.is_empty ?? false

  async function saveCriteria() {
    setEditingCriteria(false)
    if (criteriaText !== rubricQuestion.criteria && onUpdateCriteria) {
      await onUpdateCriteria(rubricQuestion.n, criteriaText)
    }
  }

  const scoreOptions = buildScoreOptions(rubricQuestion.max_points)
  const currentScore = grade?.score ?? null

  function buildScoreOptions(max: number): number[] {

    if (max === 0) return [0]
    if (max === 0.5) return [0, 0.5]
    if (max === 1) return [0, 0.5, 1]
    if (max === 2) return [0, 0.5, 1, 1.5, 2]
    if (max === 3) return [0, 1, 2, 3]
    return Array.from({ length: max + 1 }, (_, i) => i)
  }

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${isEmpty ? 'border-red-200' : ''} ${readOnly ? 'opacity-70' : ''}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{rubricQuestion.title}</span>
          <Badge variant="outline" className="text-xs">{rubricQuestion.max_points} pt</Badge>
          {isEmpty && <Badge variant="destructive" className="text-xs">Sin respuesta</Badge>}
        </div>
        {/* Score buttons */}
        <div className="flex items-center gap-1">
          {scoreOptions.map(s => (
            <button
              key={s}
              onClick={() => !readOnly && onScore(s)}
              disabled={readOnly}
              className={`h-7 min-w-[28px] px-1.5 rounded text-sm font-medium border transition-all ${
                currentScore === s
                  ? 'bg-gray-900 text-white border-gray-900'
                  : readOnly
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Content: full two-column, or pauta-only in compact mode (notebook shown separately) */}
      <div className={compact ? 'p-3' : 'grid grid-cols-2 divide-x'}>
        {!compact && (
        <div className="p-3">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Respuesta alumno</p>
          {parsedQuestion?.cells?.length ? (
            <div className="space-y-2">
              {parsedQuestion.cells.map((cell, i) => (
                <div key={i}>
                  {cell.type === 'code' ? (
                    <pre className={`text-xs font-mono bg-gray-900 text-gray-100 rounded p-3 overflow-x-auto whitespace-pre-wrap ${cell.is_placeholder ? 'opacity-40 italic' : ''}`}>
                      {cell.source || '(vacío)'}
                    </pre>
                  ) : (
                    <p className="text-xs text-gray-600 italic bg-gray-50 rounded p-2 whitespace-pre-wrap">
                      {cell.source}
                    </p>
                  )}
                  {cell.outputs?.map((out, j) => <CellOutputView key={j} output={out} />)}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-red-50 rounded p-3 text-sm text-red-500">
              No hay respuesta en esta pregunta
            </div>
          )}
        </div>
        )}

        <div className={compact ? '' : 'p-3'}>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Pauta</p>
          <div className="space-y-3">
            {editingCriteria ? (
              <textarea
                autoFocus
                value={criteriaText}
                onChange={e => setCriteriaText(e.target.value)}
                onBlur={saveCriteria}
                onKeyDown={e => { if (e.key === 'Escape') { setCriteriaText(rubricQuestion.criteria); setEditingCriteria(false) } }}
                rows={compact ? 2 : 3}
                className="w-full text-sm text-gray-700 border border-blue-300 rounded px-2 py-1 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            ) : (
              <p
                className="text-sm text-gray-700 cursor-pointer hover:bg-gray-50 rounded px-1 -mx-1 py-0.5 group relative"
                onClick={() => setEditingCriteria(true)}
                title="Click para editar criterio"
              >
                {criteriaText}
                <span className="absolute right-1 top-0.5 text-gray-300 text-xs opacity-0 group-hover:opacity-100">✎</span>
              </p>
            )}

            {expectedOutput && (
              <div className="bg-blue-50 border border-blue-200 rounded p-2">
                <p className="text-xs font-medium text-blue-600 mb-1">Output esperado (RUT)</p>
                <p className="text-sm text-blue-800 font-mono">{expectedOutput}</p>
              </div>
            )}

            {rubricQuestion.ideal_code && (
              <div>
                <button
                  onClick={() => setShowIdeal(v => !v)}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  {showIdeal ? 'Ocultar solución' : 'Ver solución ideal'}
                </button>
                {showIdeal && (
                  <pre className="mt-2 text-xs font-mono bg-gray-100 rounded p-2 overflow-x-auto whitespace-pre-wrap text-gray-700">
                    {rubricQuestion.ideal_code}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comment */}
      {!readOnly && (
        <div className="px-4 pb-3 pt-2 border-t">
          <Textarea
            placeholder="Comentario para esta pregunta…"
            value={comment}
            onChange={e => setComment(e.target.value)}
            onBlur={() => onComment(comment)}
            rows={1}
            className="text-sm resize-none"
          />
        </div>
      )}
    </div>
  )
}
