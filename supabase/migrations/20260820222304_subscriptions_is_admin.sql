-- 운영자 테스트/데모 계정용 - 결제 상태와 무관하게 Pro 기능을 열어둠.
-- 별도 UI 없음, SQL Editor에서 직접 true로 바꿔서 부여.
alter table subscriptions add column if not exists is_admin boolean not null default false;
