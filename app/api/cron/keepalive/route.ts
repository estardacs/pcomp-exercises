import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Keep-alive diario para que el proyecto Supabase (free tier) no se pause tras
// 7 días sin actividad. Lo invoca Vercel Cron (ver vercel.json): basta con un
// request externo a Supabase para reiniciar el contador de inactividad.
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  // Si CRON_SECRET está definido, Vercel lo envía como header en las llamadas de
  // cron. Lo verificamos para que nadie más dispare el endpoint.
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Query mínima: llega a Postgres a través de PostgREST (cuenta como actividad),
  // sin exponer datos (RLS aplica; con la anon key devuelve 0 filas).
  const { error } = await supabase
    .from('exercises')
    .select('id', { head: true, count: 'exact' })

  return NextResponse.json({
    ok: !error,
    ts: new Date().toISOString(),
    error: error?.message ?? null,
  })
}
