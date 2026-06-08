export function calcStreak(sessions: { date: string }[]): number {
  if (sessions.length === 0) return 0

  const dates = [...new Set(sessions.map((s) => s.date))].sort().reverse()
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  if (dates[0] !== today && dates[0] !== yesterday) return 0

  let streak = 0
  let current = new Date(dates[0])

  for (const date of dates) {
    const d = new Date(date)
    const diff = Math.round((current.getTime() - d.getTime()) / 86400000)
    if (diff <= 1) {
      streak++
      current = d
    } else {
      break
    }
  }

  return streak
}

export function calcMaxStreak(sessions: { date: string }[]): number {
  if (sessions.length === 0) return 0

  const dates = [...new Set(sessions.map((s) => s.date))].sort()
  let max = 1
  let current = 1

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1])
    const curr = new Date(dates[i])
    const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000)
    if (diff === 1) {
      current++
      max = Math.max(max, current)
    } else {
      current = 1
    }
  }

  return max
}
