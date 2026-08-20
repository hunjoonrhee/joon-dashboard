-- Pro 구독 상태 저장. 신규가입 시 트라이얼 만료일(trial_ends_at)이 설정되고,
-- Stripe 웹훅이 status/stripe_* 필드를 갱신한다. isPro는 앱 코드에서
-- (status = 'active' or 'trialing') or (now() < trial_ends_at) 로 계산한다.
create table if not exists subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status text not null default 'none', -- none | trialing | active | past_due | canceled
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

alter table subscriptions enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'subscriptions' and policyname = 'subscriptions_select_own') then
    create policy "subscriptions_select_own" on subscriptions for select using (auth.uid() = user_id);
  end if;
end $$;

-- insert/update는 service role(웹훅, 트라이얼 부여)에서만 수행 - 별도 정책 없음(RLS 기본 차단).
