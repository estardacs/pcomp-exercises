import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireGraderApi } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const auth = await requireGraderApi()
  if (auth.error) return auth.error

  const supabase = createServiceClient()
  const { exercise_id, assigned_to } = await req.json()

  const { error } = await supabase
    .from('submissions')
    .update({ assigned_to, status: 'pending' })
    .eq('exercise_id', exercise_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
