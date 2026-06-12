import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

const SYSTEM_PROMPT = `You are a personal learning coach AI.
Analyze the user's study data and provide actionable coaching insights.

Rules:
- Return ONLY valid JSON, no markdown, no backticks.
- Be specific and direct — no generic advice.
- Base all suggestions on the actual data provided.
- Keep each message under 30 words.
- Output language must match the locale specified.

JSON schema:
{
  "today": {
    "skill": "string",
    "reason": "string"
  },
  "resources": [
    {
      "type": "docs" | "youtube" | "book" | "course",
      "title": "string",
      "description": "string (max 15 words)",
      "url": "string (real URL if known, otherwise empty string)"
    }
  ],
  "pace": {
    "currentMonths": number,
    "optimizedMonths": number,
    "sessionsPerWeek": number,
    "message": "string"
  },
  "alert": {
    "hasAlert": boolean,
    "message": "string"
  }
}

For resources: provide 2 to 3 real, specific learning resources for the recommended skill. Prioritize official docs, then well-known YouTube channels, then books. Only include URLs you are confident are correct — otherwise leave url as empty string.`

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY not set' },
      { status: 500 }
    )
  }

  const { sessions, adoptedRoadmap, goals, locale } = await req.json()
  const lang =
    locale === 'de' ? 'German' : locale === 'en' ? 'English' : 'Korean'

  // 최근 30일 세션 태그 분포 계산
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentSessions = sessions.filter(
    (s: { date: string }) => new Date(s.date) >= thirtyDaysAgo
  )
  const tagFrequency: Record<string, number> = {}
  recentSessions.forEach((s: { tags: string[] }) => {
    s.tags.forEach((tag: string) => {
      tagFrequency[tag] = (tagFrequency[tag] ?? 0) + 1
    })
  })

  // 갭 분석 — 미달성 스킬 추출
  const gapSkills = adoptedRoadmap
    ? adoptedRoadmap.stages.flatMap(
        (stage: { skills: { name: string; tags: string[] }[] }) =>
          stage.skills
            .filter((sk) => !sk.tags.some((tag: string) => tagFrequency[tag]))
            .map((sk) => sk.name)
      )
    : []

  // 주간 세션 수 계산
  const weeklyAvg = recentSessions.length / 4.3

  const userPrompt = `Output language: ${lang}

Study data:
- Recent 30 days: ${recentSessions.length} sessions
- Weekly average: ${weeklyAvg.toFixed(1)} sessions/week
- Tag frequency (last 30 days): ${JSON.stringify(tagFrequency)}
- Gap skills (not yet studied): ${gapSkills.slice(0, 10).join(', ')}
- Roadmap goal: ${adoptedRoadmap?.goal ?? 'Not set'}
- Total roadmap skills: ${adoptedRoadmap?.stages.flatMap((s: { skills: unknown[] }) => s.skills).length ?? 0}
- Active goals: ${goals
    .filter((g: { status: string }) => g.status === 'in_progress')
    .map((g: { name: string }) => g.name)
    .join(', ')}

Based on this data:
1. What ONE skill should the user study today and why?
2. At current pace, how many months to complete the roadmap? What if they study 1 more session/week?
3. Is there a concerning pattern in their study habits? (e.g. avoiding certain skills, inconsistent pace)`

  // 데이터 부족 처리
  if (recentSessions.length < 3) {
    const msg =
      lang === 'German'
        ? 'Noch zu wenig Daten. Bitte mindestens 3 Lernsitzungen aufzeichnen.'
        : lang === 'English'
          ? 'Not enough data yet. Please log at least 3 study sessions.'
          : '공부 기록이 부족해. 최소 3회 이상 기록하면 분석해줄게.'
    return NextResponse.json({ insufficient: true, insufficientMessage: msg })
  }

  const requestBody = JSON.stringify({
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 4096 },
  })

  try {
    let res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody,
    })

    if (res.status === 503 || res.status === 429) {
      await sleep(3000)
      res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      })
    }

    if (!res.ok) {
      const err = await res.text()
      console.error('Gemini coach error:', err)
      return NextResponse.json({ error: 'Gemini API error' }, { status: 502 })
    }

    const data = await res.json()
    const parts = data.candidates?.[0]?.content?.parts ?? []
    const raw = parts
      .filter((p: { text?: string }) => typeof p.text === 'string')
      .map((p: { text: string }) => p.text)
      .join('')

    console.log('Coach raw:', raw.slice(0, 500))
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('No JSON, raw:', raw)
      return NextResponse.json(
        { error: 'Invalid AI response', raw: raw.slice(0, 300) },
        { status: 502 }
      )
    }

    return NextResponse.json(JSON.parse(jsonMatch[0]))
  } catch (e) {
    console.error('Coach route error:', e)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
