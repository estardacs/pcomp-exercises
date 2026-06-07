import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// Only available in development. Bypasses CAS by reusing the same
// find_uc_email + generateLink flow as the real CAS callback.
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { searchParams, origin } = new URL(request.url)
  const username = searchParams.get('username')?.toLowerCase().trim()

  if (!username) {
    return NextResponse.redirect(`${origin}/login?error=cas_no_user`)
  }

  const admin = createServiceClient()

  const { data: existingEmail } = await admin.rpc('find_uc_email', { p_username: username })
  if (!existingEmail) {
    return NextResponse.redirect(`${origin}/login?error=not_enrolled`)
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: existingEmail as string,
    options: { redirectTo: `${origin}/auth/callback` },
  })

  if (linkError || !linkData?.properties?.action_link) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  return NextResponse.redirect(linkData.properties.action_link)
}
