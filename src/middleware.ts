import { createServerClient } from '@supabase/ssr'
import createMiddleware from 'next-intl/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import { routing } from '@/i18n/routing'

const handleI18n = createMiddleware(routing)

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isLoginPage = /^\/(ko|de|en)\/login/.test(pathname)
  const isPublicPage = isLoginPage || pathname === '/'

  if (!user && !isPublicPage) {
    const locale = pathname.split('/')[1] || 'ko'
    const validLocale = ['ko', 'de', 'en'].includes(locale) ? locale : 'ko'
    return NextResponse.redirect(new URL(`/${validLocale}/login`, request.url))
  }

  if (user && isLoginPage) {
    const locale = pathname.split('/')[1] || 'ko'
    return NextResponse.redirect(new URL(`/${locale}`, request.url))
  }

  return handleI18n(request)
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|auth|.*\\..*).*)'],
}
