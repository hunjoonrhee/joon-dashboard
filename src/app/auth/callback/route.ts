import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const response = NextResponse.redirect(`${origin}/ko/onboarding/1`)

    const supabaseWithResponse = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { error, data } = await supabaseWithResponse.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // 온보딩 완료 여부 확인
      const { data: setting } = await supabaseWithResponse
        .from('settings')
        .select('value')
        .eq('key', 'onboarding_completed')
        .single()

      if (setting?.value === 'true') {
        response.headers.set('location', `${origin}/ko/dashboard`)
        return response
      }

      // nickname 저장 (소셜 로그인)
      const nickname =
        data.user.user_metadata?.nickname ||
        data.user.user_metadata?.full_name ||
        data.user.user_metadata?.name ||
        data.user.email?.split('@')[0] ||
        'User'

      await supabaseWithResponse
        .from('settings')
        .upsert(
          { key: 'name', value: nickname, user_id: data.user.id },
          { onConflict: 'key' }
        )

      // /try에서 온 경우 sessionStorage에 ob_stages가 있으면 온보딩 3단계로
      // (sessionStorage는 서버에서 읽을 수 없으므로 클라이언트에서 처리)
      // 온보딩 1단계로 보내고, 거기서 sessionStorage 체크
      return response
    }
  }

  return NextResponse.redirect(`${origin}/ko/login?error=auth_failed`)
}
