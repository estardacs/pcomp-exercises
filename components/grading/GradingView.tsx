'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { SubmissionWithGrades, Exercise, QuestionGrade, RubricQuestion } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import StudentSidebar from './StudentSidebar'
import GradingPanel from './GradingPanel'
import NotebookFullView from './NotebookFullView'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight, ChevronLeft } from 'lucide-react'

const SYNCABLE_EXERCISES = new Set(
  Array.from({ length: 13 }, (_, i) => `E${String(i + 1).padStart(2, '0')}`)
)

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
  const [notaSyncedMap, setNotaSyncedMap] = useState<Record<string, string | null>>(
    Object.fromEntries(submissions.map(s => [s.id, s.nota_synced_at ?? null]))
  )
  const [saving, setSaving] = useState(false)
  const [syncingNota, setSyncingNota] = useState(false)
  const [syncNotaMessage, setSyncNotaMessage] = useState<string | null>(null)
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

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [currentId])

  useEffect(() => {
    setSyncNotaMessage(null)
  }, [currentId])

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
  const hasAnyGrade = grades.some(g => g.score != null) || totalScore > 0
  const canSyncNota = isEditable && hasAnyGrade && SYNCABLE_EXERCISES.has(exercise.id)

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

    // Always update total_score. Only transition to in_progress from pending/unassigned —
    // never overwrite 'done' (handles both re-correction and markDone race conditions).
    await Promise.all([
      supabase.from('submissions').update({ total_score: newTotal }).eq('id', currentId),
      supabase.from('submissions').update({ status: 'in_progress' }).eq('id', currentId).in('status', ['pending', 'unassigned']),
    ])

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

  const syncNota = useCallback(async () => {
    setSyncingNota(true)
    setSyncNotaMessage(null)
    try {
      const res = await fetch('/api/notas/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission_id: currentId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSyncNotaMessage(`Error: ${data.error ?? 'No se pudo enviar la nota'}`)
      } else {
        const syncedAt = data.nota_synced_at ?? new Date().toISOString()
        setNotaSyncedMap(prev => ({ ...prev, [currentId]: syncedAt }))
        setSyncNotaMessage(`Nota ${data.nota} enviada al Excel para ${exercise.id}`)
      }
    } catch {
      setSyncNotaMessage('Error: falló la conexión con el servidor')
    }
    setSyncingNota(false)
  }, [currentId, exercise.id])

  const emptyCount = currentSub?.notebook_json?.questions?.filter(q => q.is_empty).length ?? 0
  const isDone = submissions.find(s => s.id === currentId)?.status === 'done'

  const gradingPanelProps = {
    currentSub,
    rubricQuestions,
    grades,
    totalScore,
    maxTotal,
    isEditable,
    isDone: !!isDone,
    currentIdx,
    submissionsLength: submissions.length,
    generalComment: generalComments[currentId] ?? '',
    notaSyncedAt: notaSyncedMap[currentId] ?? null,
    syncingNota,
    syncNotaMessage,
    canSyncNota,
    onScore: upsertGrade,
    onComment: upsertComment,
    onUpdateCriteria: updateCriteria,
    onGeneralCommentChange: (comment: string) => setGeneralComments(prev => ({ ...prev, [currentId]: comment })),
    onGeneralCommentBlur: saveGeneralComment,
    onMarkDone: markDone,
    onUnmarkDone: unmarkDone,
    onSyncNota: syncNota,
    onPrev: () => setCurrentId(submissions[currentIdx - 1].id),
    onNext: () => setCurrentId(submissions[currentIdx + 1].id),
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans animate-in fade-in-0 duration-200">
      <StudentSidebar
        submissions={submissions}
        gradesMap={gradesMap}
        currentId={currentId}
        onSelect={setCurrentId}
        maxTotal={maxTotal}
        userId={userId}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="inline-flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm"><ChevronLeft className="w-3.5 h-3.5" /> Dashboard</Link>
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

        <div className="bg-white border-b px-6 py-2 flex items-center justify-between shrink-0">
          <Button
            variant="ghost" size="sm"
            disabled={currentIdx === 0}
            onClick={() => setCurrentId(submissions[currentIdx - 1].id)}
          >
            <span className="flex items-center gap-1.5"><ChevronLeft className="w-4 h-4" /> Anterior</span>
          </Button>
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-medium shrink-0">
              {currentSub.student_apellido}, {currentSub.student_nombre}
            </span>
            <span className="text-sm text-gray-500 shrink-0">
              {currentSub.student_rut.toUpperCase()} · RUT termina en <strong>{currentSub.rut_last_digit}</strong>
            </span>
            <span
              className="text-xs text-gray-400 font-mono truncate max-w-xs"
              title={currentSub.filename}
            >
              {currentSub.filename}
            </span>
            <span className="text-xs text-gray-400 shrink-0">
              · {new Date(currentSub.uploaded_at).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })}
            </span>
            <span className="text-xs text-gray-400 shrink-0">({currentIdx + 1}/{submissions.length})</span>
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
            <span className="flex items-center gap-1.5">Siguiente <ChevronRight className="w-4 h-4" /></span>
          </Button>
        </div>

        <div ref={mainRef} className="flex-1 overflow-y-auto px-6 py-4">
          {fullView ? (
            <div className="flex gap-4 h-full min-h-0">
              <div className="flex-1 overflow-y-auto min-w-0">
                <NotebookFullView cells={currentSub.notebook_json?.raw_cells ?? []} />
              </div>
              <div className="w-[420px] shrink-0 overflow-y-auto border-l pl-4">
                <GradingPanel {...gradingPanelProps} compact />
              </div>
            </div>
          ) : (
            <GradingPanel {...gradingPanelProps} />
          )}
        </div>
      </div>
    </div>
  )
}
