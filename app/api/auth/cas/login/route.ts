import { NextResponse, type NextRequest } from 'next/server'

const CAS_LOGIN = 'https://sso.uc.cl/cas/login'

// GET /api/auth/cas/login
// Redirects the browser to UC CAS. The `service` param is where CAS returns
// after authentication -- must match exactly what we use during validation.
export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin
  const serviceUrl = `${origin}/api/auth/cas/callback`
  const casUrl = `${CAS_LOGIN}?service=${encodeURIComponent(serviceUrl)}`
  return NextResponse.redirect(casUrl)
}
