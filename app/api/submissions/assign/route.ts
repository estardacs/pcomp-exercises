import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createServiceClient()
  const { exercise_id, assigned_to } = await req.json()

  const { error } = await supabase
    .from('submissions')
    .update({ assigned_to, status: 'pending' })
    .eq('exercise_id', exercise_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
