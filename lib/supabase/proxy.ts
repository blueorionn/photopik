import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/confirm',
  '/auth/error',
  '/auth/logout',
  '/~offline',
  '/manifest.json',
]

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true
  return pathname.startsWith('/serwist/')
}

function redirectWithCookies(
  url: URL,
  responseWithCookies: NextResponse
): NextResponse {
  const redirectResponse = NextResponse.redirect(url)

  // setAll() wrote refreshed session cookies onto the next() response,
  // which is otherwise discarded when redirecting — carry them over or
  // token refreshes are silently lost on every redirecting request.
  responseWithCookies.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie)
  })

  return redirectResponse
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })

          supabaseResponse = NextResponse.next({
            request,
          })

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refreshes the session when needed — must run before the auth decision.
  const { data } = await supabase.auth.getClaims()
  const isLoggedIn = !!data?.claims

  const { pathname } = request.nextUrl
  const isPublic = isPublicPath(pathname)
  const isLoginPage = pathname === '/auth/login'

  if (!isLoggedIn && !isPublic) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/auth/login'
    loginUrl.search = `next=${encodeURIComponent(
      pathname + request.nextUrl.search
    )}`
    return redirectWithCookies(loginUrl, supabaseResponse)
  }

  if (isLoggedIn && isLoginPage) {
    const homeUrl = request.nextUrl.clone()
    homeUrl.pathname = '/'
    homeUrl.search = ''
    return redirectWithCookies(homeUrl, supabaseResponse)
  }

  return supabaseResponse
}
