import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const CAS_VALIDATE = 'https://sso.uc.cl/cas/p3/serviceValidate'

// Extract a named element from CAS XML response.
function extractAttr(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<cas:${tag}>([^<]+)<\\/cas:${tag}>`))
  return m ? m[1].trim() : null
}

// GET /api/auth/cas/callback?ticket=ST-xxxx
// Called by UC CAS after the user authenticates. We validate the ticket,
// find/create the Supabase user, and redirect the browser to complete the
// Supabase PKCE auth flow so session cookies are set.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const ticket = searchParams.get('ticket')

  if (!ticket) {
    return NextResponse.redirect(`${origin}/login?error=cas_no_ticket`)
  }

  const serviceUrl = `${origin}/api/auth/cas/callback`

  // 1. Validate ticket with UC CAS (CAS 3.0 protocol for richer attributes).
  const validateUrl = new URL(CAS_VALIDATE)
  validateUrl.searchParams.set('service', serviceUrl)
  validateUrl.searchParams.set('ticket', ticket)

  let casXml: string
  try {
    const res = await fetch(validateUrl.toString())
    casXml = await res.text()
  } catch {
    return NextResponse.redirect(`${origin}/login?error=cas_network`)
  }

  if (casXml.includes('<cas:authenticationFailure')) {
    return NextResponse.redirect(`${origin}/login?error=cas_invalid`)
  }

  const casUsername = extractAttr(casXml, 'user')
  if (!casUsername) {
    return NextResponse.redirect(`${origin}/login?error=cas_no_user`)
  }

  const email = `${casUsername.toLowerCase()}@uc.cl`

  // Extract optional attributes UC CAS may return.
  const displayName =
    extractAttr(casXml, 'displayName') ??
    extractAttr(casXml, 'cn') ??
    casUsername

  // Some Chilean universities return the RUT as a CAS attribute.
  const casRut = extractAttr(casXml, 'rut') ?? extractAttr(casXml, 'ucRut')

  // 2. Generate a Supabase magic-link. This upserts the auth user (creates if
  //    new, finds if existing) and returns a one-time link we redirect to.
  const admin = createServiceClient()
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: {
      redirectTo: `${origin}/auth/callback`,
      data: { name: displayName },
    },
  })

  if (linkError || !linkData?.properties?.action_link) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // 3. If CAS returned a RUT and the profile doesn't have one yet, link it now.
  if (casRut && linkData.user) {
    const userId = linkData.user.id
    const { data: prof } = await admin
      .from('profiles')
      .select('rut')
      .eq('id', userId)
      .single()

    if (!prof?.rut) {
      // Normalize RUT to submission format (lowercase, no dots/dashes).
      const normalized = casRut.trim().toLowerCase().replace(/[.\-\s]/g, '')
      await admin
        .from('profiles')
        .update({ rut: normalized })
        .eq('id', userId)
    }
  }

  // 4. Redirect browser to Supabase verify endpoint. It will process the
  //    magic-link token and redirect to /auth/callback?code=... (PKCE flow).
  return NextResponse.redirect(linkData.properties.action_link)
}
