import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireProfesorApi } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const auth = await requireProfesorApi()
  if (auth.error) return auth.error

  const { name, email, password, role = 'ayudante' } = await request.json()
  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
  }

  const admin = createServiceClient()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role },
  })

  if (error) {
    console.error('createUser error:', JSON.stringify(error))
    return NextResponse.json({ error: `${error.message} (código: ${error.status ?? 'desconocido'})` }, { status: 400 })
  }

  const { error: profileError } = await admin
    .from('profiles')
    .upsert({ id: data.user.id, name, role })
  if (profileError) console.error('profile upsert error:', JSON.stringify(profileError))

  return NextResponse.json({ ok: true, id: data.user.id })
}

export async function PATCH(request: NextRequest) {
  const auth = await requireProfesorApi()
  if (auth.error) return auth.error

  const { id, role } = await request.json()
  if (!id || !role) return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })

  const admin = createServiceClient()
  const { error } = await admin.from('profiles').update({ role }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const auth = await requireProfesorApi()
  if (auth.error) return auth.error

  const { id } = await request.json()
  if (id === auth.user.id) return NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 400 })

  const admin = createServiceClient()
  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await admin.from('profiles').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
