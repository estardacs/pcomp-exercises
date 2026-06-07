import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const origin = new URL(req.url).origin
  // 303 so the browser follows the redirect with GET (the form submits via POST).
  return NextResponse.redirect(`${origin}/login`, { status: 303 })
}
