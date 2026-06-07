import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireGraderApi } from '@/lib/auth'

export async function POST(req: Request) {
  const auth = await requireGraderApi()
  if (auth.error) return auth.error

  const body = await req.json().catch(() => ({}))
  const { exercise_id, user_ids } = body as { exercise_id?: string; user_ids?: string[] }

  const admin = createServiceClient()

  const [{ data: allUsers }, { data: subs }] = await Promise.all([
    admin.from('profiles').select('id').eq('role', 'ayudante').order('id'),
    exercise_id
      ? admin.from('submissions').select('id, exercise_id').eq('exercise_id', exercise_id)
      : admin.from('submissions').select('id, exercise_id'),
  ])

  if (!subs?.length) return NextResponse.json({ ok: true, assigned: 0 })

  const targets = user_ids?.length
    ? user_ids
    : (allUsers ?? []).map((u: { id: string }) => u.id)

  if (!targets.length) return NextResponse.json({ error: 'Sin usuarios' }, { status: 400 })

  // Group by exercise and distribute round-robin
  const byEx: Record<string, string[]> = {}
  subs.forEach((s: { id: string; exercise_id: string }) => {
    byEx[s.exercise_id] = byEx[s.exercise_id] ?? []
    byEx[s.exercise_id].push(s.id)
  })

  const updates: Array<{ id: string; assigned_to: string }> = []
  for (const ids of Object.values(byEx)) {
    ids.forEach((id, i) => {
      updates.push({ id, assigned_to: targets[i % targets.length] })
    })
  }

  // Batch updates by assigned_to to minimize round trips
  const byUser: Record<string, string[]> = {}
  updates.forEach(u => {
    byUser[u.assigned_to] = byUser[u.assigned_to] ?? []
    byUser[u.assigned_to].push(u.id)
  })

  await Promise.all(
    Object.entries(byUser).map(([userId, ids]) =>
      admin.from('submissions')
        .update({ assigned_to: userId, status: 'pending' })
        .in('id', ids)
    )
  )

  return NextResponse.json({ ok: true, assigned: updates.length })
}
