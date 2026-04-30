'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { SubmissionWithGrades, Exercise, QuestionGrade, RubricQuestion } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { resolveExpectedOutput } from '@/lib/rut-helpers'
import StudentSidebar from './StudentSidebar'
import AnswerCard from './AnswerCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Props {
  submissions: SubmissionWithGrades[]
  exercise: Exercise
  initialStudentId: string
  userId: string
  mineOnly?: boolean
}

export default function GradingView({ submissions, exercise, initialStudentId, userId, mineOnly }: Props) {
  const supabase = createClient()
  const router = useRouter()

  const [currentId, setCurrentId] = useState(initialStudentId)
  const [gradesMap, setGradesMap] = useState<Record<string, QuestionGrade[]>>(
    Object.fromEntries(submissions.map(s => [s.id, s.grades]))
  )
  const [generalComments, setGeneralComments] = useState<Record<string, string>>(
    Object.fromEntries(submissions.map(s => [s.id, s.general_comment ?? '']))
  )
  const [saving, setSaving] = useState(false)
  const [fullView, setFullView] = useState(false)
  const [rubricQuestions, setRubricQuestions] = useState<RubricQuestion[]>(exercise.rubrica?.questions ?? [])
  const mainRef = useRef<HTMLDivElement>(null)

  const updateCriteria = useCallback(async (n: number, criteria: string) => {
    const updated = rubricQuestions.map(q => q.n === n ? { ...q, criteria } : q)
    setRubricQuestions(updated)
    const newRubrica = { ...exercise.rubrica, questions: updated }
    await fetch(`/api/ejercicios/${exercise.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rubrica: newRubrica }),
    })
  }, [rubricQuestions, exercise])

  const currentSub = submissions.find(s => s.id === currentId) ?? submissions[0]
  const currentIdx = submissions.findIndex(s => s.id === currentId)
  const grades = gradesMap[currentId] ?? []
  const isEditable = currentSub?.assigned_to === userId

  // Scroll to top when switching students
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [currentId])

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'ArrowLeft' && currentIdx > 0) {
        setCurrentId(submissions[currentIdx - 1].id)
      }
      if (e.key === 'ArrowRight' && currentIdx < submissions.length - 1) {
        setCurrentId(submissions[currentIdx + 1].id)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [currentIdx, submissions])

  const totalScore = grades.reduce((sum, g) => sum + (g.score ?? 0), 0)
  const maxTotal = rubricQuestions.reduce((sum, q) => sum + q.max_points, 0)

  const upsertGrade = useCallback(async (
    questionN: number,
    score: number,
    comment?: string
  ) => {
    setSaving(true)
    const rubQ = rubricQuestions.find(q => q.n === questionN)
    const existing = (gradesMap[currentId] ?? []).find(g => g.question_n === questionN)

    const payload = {
      submission_id: currentId,
      question_n: questionN,
      question_title: rubQ?.title ?? '',
      max_points: rubQ?.max_points ?? 1,
      score,
      comment: comment ?? existing?.comment ?? null,
      graded_by: userId,
    }

    const { data } = await supabase
      .from('question_grades')
      .upsert(payload, { onConflict: 'submission_id,question_n' })
      .select()
      .single()

    if (data) {
      setGradesMap(prev => ({
        ...prev,
        [currentId]: [
          ...(prev[currentId] ?? []).filter(g => g.question_n !== questionN),
          data,
        ],
      }))
    }

    const newGrades = [
      ...(gradesMap[currentId] ?? []).filter(g => g.question_n !== questionN),
      { ...payload, score },
    ]
    const newTotal = newGrades.reduce((s, g) => s + (g.score ?? 0), 0)
    await supabase
      .from('submissions')
      .update({ total_score: newTotal, status: 'in_progress' })
      .eq('id', currentId)

    setSaving(false)
  }, [currentId, gradesMap, rubricQuestions, supabase, userId])

  const upsertComment = useCallback(async (questionN: number, comment: string) => {
    const existing = (gradesMap[currentId] ?? []).find(g => g.question_n === questionN)
    if (existing?.score == null) return
    await upsertGrade(questionN, existing.score, comment)
  }, [currentId, gradesMap, upsertGrade])

  const markDone = useCallback(async () => {
    await supabase.from('submissions').update({
      status: 'done',
      total_score: totalScore,
      general_comment: generalComments[currentId] || null,
      graded_at: new Date().toISOString(),
    }).eq('id', currentId)

    const firstPending = submissions.find(s => s.id !== currentId && s.assigned_to === userId && s.status !== 'done')
    if (firstPending) setCurrentId(firstPending.id)
    router.refresh()
  }, [supabase, currentId, totalScore, generalComments, submissions, userId, router])

  const unmarkDone = useCallback(async () => {
    await supabase.from('submissions').update({
      status: 'in_progress',
      graded_at: null,
    }).eq('id', currentId)
    router.refresh()
  }, [supabase, currentId, router])

  const saveGeneralComment = useCallback(async (comment: string) => {
    setGeneralComments(prev => ({ ...prev, [currentId]: comment }))
    await supabase.from('submissions').update({ general_comment: comment }).eq('id', currentId)
  }, [currentId, supabase])

  const emptyCount = currentSub?.notebook_json?.questions?.filter(q => q.is_empty).length ?? 0
  const isDone = submissions.find(s => s.id === currentId)?.status === 'done'

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans">
      <StudentSidebar
        submissions={submissions}
        gradesMap={gradesMap}
        currentId={currentId}
        onSelect={setCurrentId}
        maxTotal={maxTotal}
        userId={userId}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top nav */}
        <div className="bg-white border-b px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← Dashboard</Link>
            <span className="text-gray-300">|</span>
            <span className="font-semibold">{exercise.id}: {exercise.title}</span>
            <Link href={`/pauta/${exercise.id}`} className="text-xs text-gray-400 hover:text-blue-600 underline">Editar pauta</Link>
            {!mineOnly && (
              <Link href={`/corregir/${exercise.id}?mine=true`} className="text-xs text-blue-600 hover:text-blue-800 underline">
                Solo mis asignadas
              </Link>
            )}
            {mineOnly && (
              <Link href={`/corregir/${exercise.id}`} className="text-xs text-gray-400 hover:text-gray-600 underline">
                Ver todas
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setFullView(v => !v)}>
              {fullView ? 'Vista respuestas' : 'Vista notebook completo'}
            </Button>
            {saving && <span className="text-xs text-gray-400">Guardando…</span>}
          </div>
        </div>

        {/* Navigation bar */}
        <div className="bg-white border-b px-6 py-2 flex items-center justify-between shrink-0">
          <Button
            variant="ghost" size="sm"
            disabled={currentIdx === 0}
            onClick={() => setCurrentId(submissions[currentIdx - 1].id)}
          >
            ← Anterior
          </Button>
          <div className="flex items-center gap-3">
            <span className="font-medium">
              {currentSub.student_apellido}, {currentSub.student_nombre}
            </span>
            <span className="text-sm text-gray-500">
              {currentSub.student_rut.toUpperCase()} · RUT termina en <strong>{currentSub.rut_last_digit}</strong>
            </span>
            <span className="text-xs text-gray-400">({currentIdx + 1}/{submissions.length})</span>
            {emptyCount > 0 && (
              <Badge variant="destructive" className="text-xs">⚠ {emptyCount} sin respuesta</Badge>
            )}
            {isDone && <Badge className="bg-green-600 text-xs">✓ Revisado</Badge>}
            {!isEditable && (
              <Badge variant="secondary" className="text-xs">Solo lectura</Badge>
            )}
          </div>
          <Button
            variant="ghost" size="sm"
            disabled={currentIdx === submissions.length - 1}
            onClick={() => setCurrentId(submissions[currentIdx + 1].id)}
          >
            Siguiente →
          </Button>
        </div>

        {/* Scrollable content */}
        <div ref={mainRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {fullView ? (
            <div className="max-w-3xl mx-auto space-y-2">
              {(currentSub.notebook_json?.raw_cells ?? []).map((cell, i) => (
                <div key={i} className={`rounded border ${cell.type === 'code' ? 'bg-gray-900 text-gray-100' : 'bg-white'} p-3`}>
                  {cell.type === 'code' ? (
                    <pre className="text-xs font-mono whitespace-pre-wrap">{cell.source}</pre>
                  ) : (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{cell.source}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <>
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
                    onScore={(score) => upsertGrade(rubQ.n, score)}
                    onComment={(comment) => upsertComment(rubQ.n, comment)}
                    onUpdateCriteria={updateCriteria}
                    readOnly={!isEditable}
                  />
                )
              })}

              {/* Total + general comment + mark done */}
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
                {isEditable && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Comentario general</label>
                    <Textarea
                      placeholder="Comentario general sobre el trabajo del alumno…"
                      value={generalComments[currentId] ?? ''}
                      onChange={e => setGeneralComments(prev => ({ ...prev, [currentId]: e.target.value }))}
                      onBlur={e => saveGeneralComment(e.target.value)}
                      rows={2}
                    />
                  </div>
                )}
                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="ghost" size="sm"
                    disabled={currentIdx === 0}
                    onClick={() => setCurrentId(submissions[currentIdx - 1].id)}
                  >
                    ← Anterior
                  </Button>
                  {isEditable && (
                    <div className="flex gap-2">
                      {isDone ? (
                        <Button variant="outline" size="sm" onClick={unmarkDone} className="text-gray-600">
                          Quitar revisado
                        </Button>
                      ) : (
                        <Button onClick={markDone} className="bg-green-600 hover:bg-green-700">
                          ✓ Marcar como revisado
                        </Button>
                      )}
                    </div>
                  )}
                  <Button
                    variant="ghost" size="sm"
                    disabled={currentIdx === submissions.length - 1}
                    onClick={() => setCurrentId(submissions[currentIdx + 1].id)}
                  >
                    Siguiente →
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
