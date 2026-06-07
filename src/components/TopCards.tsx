import type { Session, Topic } from '@/types'

interface Props {
  sessions: Session[]
  topics: Topic[]
  settings: Record<string, string>
}

export default function TopCards({ sessions, topics, settings }: Props) {
  const thisMonth = new Date().getMonth()
  const sessionCount = sessions.filter(
    (s) => new Date(s.date).getMonth() === thisMonth
  ).length

  const lastSession = sessions[0]
  const daysSince = lastSession
    ? Math.floor(
        (new Date().getTime() - new Date(lastSession.date).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null

  const monthlyTarget = parseInt(settings.monthly_session_target ?? '12')

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-xs text-gray-500 mb-1">큰 목표</p>
        <p className="text-base font-semibold text-gray-800">
          {settings.big_goal ?? '리드 아키텍트'}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {settings.big_goal_sub ?? '시니어 → 리드 → 아키텍트'}
        </p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-xs text-gray-500 mb-1">마지막 세션</p>
        <p
          className={`text-2xl font-semibold ${daysSince && daysSince > 3 ? 'text-orange-400' : 'text-gray-800'}`}
        >
          {daysSince !== null ? `${daysSince}일 전` : '-'}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {lastSession
            ? new Date(lastSession.date).toLocaleDateString('ko-KR')
            : '기록 없음'}
        </p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-xs text-gray-500 mb-1">이번달 세션</p>
        <p className="text-2xl font-semibold text-gray-800">{sessionCount}회</p>
        <p className="text-xs text-gray-400 mt-1">목표: 월 {monthlyTarget}회</p>
      </div>
    </div>
  )
}
