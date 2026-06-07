import { NextResponse } from 'next/server'
import { requireGraderApi } from '@/lib/auth'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await requireGraderApi()
  if (auth.error) return auth.error
  const supabase = auth.supabase

  const body = await req.json()
  const { rubrica } = body

  const { error } = await supabase
    .from('exercises')
    .update({ rubrica })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
