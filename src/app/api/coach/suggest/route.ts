import { supabase } from '@/lib/supabase'
import type { RoadmapStage } from '@/types'
import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

const SYSTEM_PROMPT = `You are an expert learning path designer who can create roadmaps for any domain — programming, languages, music, design, fitness, or any other skill.
Given a person's current level and their final goal, generate a realistic and actionable learning roadmap.

Rules:
- Return ONLY valid JSON, no markdown, no explanation, no backticks.
- Generate 4 to 6 stages from current level to the final goal.
- Each stage must have 4 to 6 skills or competencies relevant to the domain.
- Each skill must have 5 to 10 tags — always in English. Be granular and exhaustive.
- Tags must include the main technology AND its specific sub-features, APIs, patterns, or keywords a learner would actually search or use.
- Example for "Angular Signals": tags ["Angular", "Signals", "computed", "effect", "Signal API", "Reactivity", "Zone.js"]
- Example for "RxJS Operators": tags ["RxJS", "Observable", "switchMap", "mergeMap", "combineLatest", "Subject", "BehaviorSubject", "pipe"]
- Example for "German Grammar": tags ["German", "Grammatik", "Dativ", "Akkusativ", "Nominativ", "Kasus", "Artikel"]
- Never use only broad category names. Always drill down to specific sub-concepts.
- Stage titles, skill names, and descriptions must be written in the output language specified by the user.
- Descriptions should be concise (max 20 words).
- The last stage must represent achieving the final goal.
- Adapt the structure naturally to the domain: technical skills for coding, vocabulary/grammar for languages, techniques for music, etc.

JSON schema:
{
  "stages": [
    {
      "level": 1,
      "title": "string",
      "description": "string",
      "skills": [
        {
          "name": "string",
          "description": "string",
          "tags": ["string"]
        }
      ]
    }
  ]
}`

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY not set' },
      { status: 500 }
    )
  }

  const { goal, careerLevel, locale } = await req.json()
  const lang =
    locale === 'de' ? 'German' : locale === 'en' ? 'English' : 'Korean'
  if (!goal || !careerLevel) {
    return NextResponse.json(
      { error: 'goal and careerLevel are required' },
      { status: 400 }
    )
  }

  const userPrompt = `Current level: ${careerLevel}
Final goal: ${goal}
Output language: ${lang}

Generate a learning roadmap from the current level to the final goal. Adapt the content naturally to the domain (e.g. programming, language learning, music, design, etc.). All stage titles, skill names, and descriptions must be written in ${lang}. Tags must always be in English.`

  const requestBody = JSON.stringify({
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
  })

  try {
    let geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody,
    })

    // 503 / 429 — 3초 후 1회 retry
    if (geminiRes.status === 503 || geminiRes.status === 429) {
      await sleep(3000)
      geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      })
    }

    if (!geminiRes.ok) {
      const err = await geminiRes.text()
      console.error('Gemini error:', err)
      return NextResponse.json({ error: 'Gemini API error' }, { status: 502 })
    }

    const geminiData = await geminiRes.json()

    // thinking 모델은 parts가 여러 개일 수 있음 — text 타입만 추출
    const parts = geminiData.candidates?.[0]?.content?.parts ?? []
    const raw =
      parts
        .filter((p: { text?: string }) => typeof p.text === 'string')
        .map((p: { text: string }) => p.text)
        .join('') ?? ''

    console.log('Gemini raw:', raw.slice(0, 300))

    // backtick, thinking 태그, 앞뒤 공백 제거 후 { 로 시작하는 JSON 추출
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('No JSON found in raw:', raw)
      return NextResponse.json(
        { error: 'Invalid AI response', raw: raw.slice(0, 500) },
        { status: 502 }
      )
    }
    const parsed = JSON.parse(jsonMatch[0])

    const stages: RoadmapStage[] = parsed.stages

    // Supabase에 저장
    const { data, error } = await supabase
      .from('ai_roadmaps')
      .insert({ goal, career_level: careerLevel, stages, adopted: false })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'DB save failed' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (e) {
    console.error('Route error:', e)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
