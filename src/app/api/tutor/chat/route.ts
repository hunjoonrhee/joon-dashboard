import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

const SYSTEM_PROMPT = `You are a personal 1:1 AI tutor. Your job is to teach the user a specific topic interactively.

Rules:
- Teach in a conversational, friendly tone.
- Start by giving a clear, concise explanation of the topic (max 80 words).
- After explaining a concept, ask ONE quiz question to check understanding.
- Format quizzes as JSON inside your response like this:
  [QUIZ]{"question":"...","options":["A","B","C"],"correct":1}[/QUIZ]
  (correct is 0-indexed)
- When the user answers correctly, praise them briefly and move to the next concept.
- When the user answers incorrectly, explain why and try again.
- Keep responses under 100 words unless explaining something complex.
- Output language must match the locale specified.
- After covering 3-5 concepts, provide a session summary with covered concepts as a JSON block:
  [SUMMARY]{"concepts":["concept1","concept2"],"tags":["tag1","tag2"]}[/SUMMARY]`

interface Message {
  role: 'user' | 'model'
  parts: { text: string }[]
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY not set' },
      { status: 500 }
    )
  }

  const { topic, messages, locale } = await req.json()
  const lang =
    locale === 'de' ? 'German' : locale === 'en' ? 'English' : 'Korean'

  const history: Message[] = messages ?? []

  // 첫 메시지면 튜터 세션 시작 프롬프트 주입
  const contents: Message[] =
    history.length === 0
      ? [
          {
            role: 'user',
            parts: [
              {
                text: `Output language: ${lang}\n\nTeach me about: ${topic}\n\nStart with a brief explanation, then quiz me.`,
              },
            ],
          },
        ]
      : history

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Gemini tutor error:', err)
      return NextResponse.json({ error: 'Gemini API error' }, { status: 502 })
    }

    const data = await res.json()
    const parts = data.candidates?.[0]?.content?.parts ?? []
    const raw = parts
      .filter((p: { text?: string }) => typeof p.text === 'string')
      .map((p: { text: string }) => p.text)
      .join('')

    // 퀴즈 파싱
    const quizMatch = raw.match(/\[QUIZ\]([\s\S]*?)\[\/QUIZ\]/)
    const quiz = quizMatch ? JSON.parse(quizMatch[1]) : null

    // 세션 요약 파싱
    const summaryMatch = raw.match(/\[SUMMARY\]([\s\S]*?)\[\/SUMMARY\]/)
    const summary = summaryMatch ? JSON.parse(summaryMatch[1]) : null

    // 마커 제거한 순수 텍스트
    const text = raw
      .replace(/\[QUIZ\][\s\S]*?\[\/QUIZ\]/g, '')
      .replace(/\[SUMMARY\][\s\S]*?\[\/SUMMARY\]/g, '')
      .trim()

    return NextResponse.json({ text, quiz, summary })
  } catch (e) {
    console.error('Tutor route error:', e)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
