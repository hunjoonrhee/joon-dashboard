import { routing } from '@/i18n/routing';
import { createServerClient } from '@supabase/ssr';
import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';

const handleI18n = createMiddleware(routing);
const LOCALES = ['ko', 'de', 'en'];

/** Best-matching locale from Accept-Language, falling back to routing.defaultLocale. */
function negotiateLocale(request: NextRequest): string {
  const acceptLanguage = request.headers.get('accept-language');
  if (!acceptLanguage) return routing.defaultLocale;

  const preferred = acceptLanguage
    .split(',')
    .map((part) => part.split(';')[0].trim().toLowerCase().split('-')[0]);

  return preferred.find((lang) => LOCALES.includes(lang)) ?? routing.defaultLocale;
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const locale = LOCALES.includes(pathname.split('/')[1]) ? pathname.split('/')[1] : negotiateLocale(request);

  const isLoginPage = /^\/(ko|de|en)\/login$/.test(pathname);
  const isSignupPage = /^\/(ko|de|en)\/signup$/.test(pathname);
  const isTryPage = /^\/(ko|de|en)\/try/.test(pathname);
  const isLandingPage = /^\/(ko|de|en)$/.test(pathname);
  const isOnboardingPage = /^\/(ko|de|en)\/onboarding/.test(pathname);
  const isLegalPage = /^\/(ko|de|en)\/(terms|privacy)$/.test(pathname);
  const isVerifyPage = /^\/(ko|de|en)\/verify$/.test(pathname);
  const isPublicPage =
    isLoginPage ||
    isSignupPage ||
    isTryPage ||
    isLandingPage ||
    isOnboardingPage ||
    isLegalPage ||
    isVerifyPage ||
    pathname === '/';

  // 비로그인 → 보호된 페이지 → 랜딩으로
  if (!user && !isPublicPage) {
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  // 로그인 상태 + 랜딩/로그인/회원가입 접근 → 온보딩 완료 여부 확인
  if (user && (isLoginPage || isSignupPage)) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
    // const { data: setting } = await supabase
    //   .from('settings')
    //   .select('value')
    //   .eq('key', 'onboarding_completed')
    //   .eq('user_id', user.id) // 추가
    //   .single();

    // console.log('setting:', setting);
    // if (setting?.value === 'true') {
    //   return NextResponse.redirect(
    //     new URL(`/${locale}/dashboard`, request.url)
    //   );
    // } else {
    //   return NextResponse.redirect(
    //     new URL(`/${locale}/onboarding/1`, request.url)
    //   );
    // }
  }

  return handleI18n(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|auth|.*\\..*).*)'],
};
