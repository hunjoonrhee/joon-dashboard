@AGENTS.md

# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

**Growpath** — AI 개인 성장 나침반 앱. 목표 → AI 로드맵 → 공부기록 → 갭분석 → 오늘의 추천.
무료 + Pro(€9.99/월). 타겟: 독학러(IT 전환/자격증, 독일 거주 외국인 언어학습자). 시장 순서: 한국 → 독일 → 일본.

## Stack

Next.js 16 App Router (`src/app/[locale]`), TypeScript strict, Tailwind v4 (설정은 `globals.css`의
`@theme`, `tailwind.config.js` 없음), next-intl(`messages/{ko,de,en}.json`), `@supabase/ssr`,
React Query, Zustand, `lucide-react`. AI는 Gemini(`/api/roadmap/generate`, `/api/coach/suggest`,
`/api/tutor/chat`), 음성은 OpenAI(`/api/speech/*`, 발음평가만 Azure). 배포 Vercel.

**growpath-mobile**(별도 레포, Expo)과 같은 Supabase 프로젝트·같은 `settings` 키-값 테이블 공유
(`insertWithUser`/`upsertWithUser` 패턴도 동일). CompassDial 로직은 mobile `geometry.ts`와 동일 포팅.

## 디자인 시스템

growpath-mobile 리디자인 톤(그린/크림, `#2F5D50`) 이식됨 — `indigo-*`/`violet-*`/`gray-*` 금지,
`bg-pri`/`text-ink-dim`/`border-border` 등 `globals.css` 토큰 사용. 다크모드는 `:root` /
`@media prefers-color-scheme` / `[data-theme]` 세 군데 동시 정의(하나만 고치면 토글 깨짐),
제어는 `src/lib/theme-context.tsx`. 폰트 IBM Plex Sans KR. 아이콘 `lucide-react`만
(`src/lib/nav-items.ts`에 nav 공유). 진행률 다이얼(`src/components/compass-dial/`)은
헤드라인 수치 1곳에만 — 리스트 행은 기존 얇은 바 유지.

## 규칙

- SRP, 컴포넌트 잘게 분리, TS strict(암묵적 any 금지)
- i18n 하드코딩 금지 — `messages/{ko,de,en}.json` 3개 동시 업데이트 (AI/DB가 채우는 동적 콘텐츠는 예외)
- `supabase/migrations` 폴더 없음 — 스키마는 Supabase 대시보드/CLI로 직접 관리

## 환경변수

NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY,
NEXT_PUBLIC_SITE_URL, AZURE_SPEECH_KEY, AZURE_SPEECH_REGION, OPENAI_API_KEY
