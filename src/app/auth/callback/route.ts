import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const response = NextResponse.redirect(`${origin}/ko/onboarding/1`);

    const supabaseWithResponse = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { error, data } = await supabaseWithResponse.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // 온보딩 완료 여부 확인
      const { data: setting } = await supabaseWithResponse
        .from('settings')
        .select('value')
        .eq('key', 'onboarding_completed')
        .single();

      if (setting?.value === 'true') {
        response.headers.set('location', `${origin}/ko/dashboard`);
        return response;
      }

      // 신규 유저 최초 진입 시점 - 7일 Pro 체험 부여 (Stripe 없이 앱 자체에서
      // 트라이얼 시작, 결제 정보 없이도 즉시 시작됨). 이미 row가 있으면(재확인
      // 등으로 이 경로를 다시 타는 경우) 덮어쓰지 않음. subscriptions는 RLS상
      // service role만 쓸 수 있어 anon+쿠키 클라이언트가 아닌 별도 admin
      // 클라이언트로 처리 - 클라이언트가 직접 이 테이블에 쓸 수 있게 허용하면
      // status='active' 같은 임의 값을 넣어 결제 없이 Pro를 자칭할 수 있음.
      const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
      const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await supabaseAdmin
        .from('subscriptions')
        .upsert({ user_id: data.user.id, trial_ends_at: trialEndsAt }, { onConflict: 'user_id', ignoreDuplicates: true });

      // nickname 저장 (소셜 로그인)
      const nickname =
        data.user.user_metadata?.nickname ||
        data.user.user_metadata?.full_name ||
        data.user.user_metadata?.name ||
        data.user.email?.split('@')[0] ||
        'User';

      await supabaseWithResponse
        .from('settings')
        .upsert({ key: 'name', value: nickname, user_id: data.user.id }, { onConflict: 'key,user_id' });

      // /try에서 온 경우 sessionStorage에 ob_stages가 있으면 온보딩 3단계로
      // (sessionStorage는 서버에서 읽을 수 없으므로 클라이언트에서 처리)
      // 온보딩 1단계로 보내고, 거기서 sessionStorage 체크
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/ko/login?error=auth_failed`);
}
