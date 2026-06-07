import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Next.js 16: the `middleware` convention was renamed to `proxy`.
// This keeps the Supabase auth session fresh and gates unauthenticated access.
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Run on pages only. API routes are excluded: they authorize themselves,
    // and some (e.g. student RUT login) must be reachable while signed out.
    '/((?!api|auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
