'use client'

import type { SubmissionWithGrades, QuestionGrade, RubricQuestion } from '@/types/database'
import { resolveExpectedOutput } from '@/lib/rut-helpers'
import AnswerCard from './AnswerCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ChevronRight, ChevronLeft, Send } from 'lucide-react'

interface Props {
  currentSub: SubmissionWithGrades
  rubricQuestions: RubricQuestion[]
  grades: QuestionGrade[]
  totalScore: number
  maxTotal: number
  isEditable: boolean
  isDone: boolean
  currentIdx: number
  submissionsLength: number
  generalComment: string
  notaSyncedAt: string | null
  compact?: boolean
  syncingNota: boolean
  syncNotaMessage: string | null
  canSyncNota: boolean
  onScore: (questionN: number, score: number) => void
  onComment: (questionN: number, comment: string) => void
  onUpdateCriteria: (n: number, criteria: string) => Promise<void>
  onGeneralCommentChange: (comment: string) => void
  onGeneralCommentBlur: (comment: string) => void
  onMarkDone: () => void
  onUnmarkDone: () => void
  onSyncNota: () => void
  onPrev: () => void
  onNext: () => void
}

export default function GradingPanel({
  currentSub,
  rubricQuestions,
  grades,
  totalScore,
  maxTotal,
  isEditable,
  isDone,
  currentIdx,
  submissionsLength,
  generalComment,
  notaSyncedAt,
  compact,
  syncingNota,
  syncNotaMessage,
  canSyncNota,
  onScore,
  onComment,
  onUpdateCriteria,
  onGeneralCommentChange,
  onGeneralCommentBlur,
  onMarkDone,
  onUnmarkDone,
  onSyncNota,
  onPrev,
  onNext,
}: Props) {
  return (
    <div className={`space-y-4 ${compact ? '' : ''}`}>
      {rubricQuestions.map(rubQ => {
        const parsedQ = currentSub.notebook_json?.questions?.find(q => q.n === rubQ.n)
          ?? currentSub.notebook_json?.questions?.[rubQ.n - 1]
        const grade = grades.find(g => g.question_n === rubQ.n)
        const expected = resolveExpectedOutput(rubQ, currentSub.rut_last_digit, currentSub.student_nombre)

        return (
          <AnswerCard
            key={rubQ.n}
            rubricQuestion={rubQ}
            parsedQuestion={parsedQ ?? null}
            grade={grade ?? null}
            expectedOutput={expected}
            onScore={(score) => onScore(rubQ.n, score)}
            onComment={(comment) => onComment(rubQ.n, comment)}
            onUpdateCriteria={onUpdateCriteria}
            readOnly={!isEditable}
            compact={compact}
          />
        )
      })}

      <div className={`bg-white rounded-lg border p-4 space-y-3 ${!isEditable ? 'opacity-60' : ''}`}>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-lg">Total: {totalScore}/{maxTotal}</span>
          <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${maxTotal > 0 ? (totalScore / maxTotal) * 100 : 0}%` }}
            />
          </div>
        </div>

        {notaSyncedAt && (
          <Badge variant="outline" className="text-xs text-green-700 border-green-300">
            Nota enviada al Excel · {new Date(notaSyncedAt).toLocaleString('es-CL')}
          </Badge>
        )}

        {syncNotaMessage && (
          <p className={`text-xs ${syncNotaMessage.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
            {syncNotaMessage}
          </p>
        )}

        {isEditable && (
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Comentario general</label>
            <Textarea
              placeholder="Comentario general sobre el trabajo del alumno…"
              value={generalComment}
              onChange={e => onGeneralCommentChange(e.target.value)}
              onBlur={e => onGeneralCommentBlur(e.target.value)}
              rows={2}
            />
          </div>
        )}

        <div className="flex items-center justify-between pt-2 gap-2 flex-wrap">
          <Button variant="ghost" size="sm" disabled={currentIdx === 0} onClick={onPrev}>
            <span className="flex items-center gap-1.5"><ChevronLeft className="w-4 h-4" /> Anterior</span>
          </Button>
          {isEditable && (
            <div className="flex gap-2 flex-wrap justify-center">
              {isDone ? (
                <Button variant="outline" size="sm" onClick={onUnmarkDone} className="text-gray-600">
                  Quitar revisado
                </Button>
              ) : (
                <Button onClick={onMarkDone} className="bg-green-600 hover:bg-green-700">
                  ✓ Marcar como revisado
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onSyncNota}
                disabled={!canSyncNota || syncingNota}
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                {syncingNota ? 'Enviando…' : <span className="flex items-center gap-1.5">Enviar nota al Excel <Send className="w-3.5 h-3.5" /></span>}
              </Button>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            disabled={currentIdx === submissionsLength - 1}
            onClick={onNext}
          >
            <span className="flex items-center gap-1.5">Siguiente <ChevronRight className="w-4 h-4" /></span>
          </Button>
        </div>
      </div>
    </div>
  )
}
