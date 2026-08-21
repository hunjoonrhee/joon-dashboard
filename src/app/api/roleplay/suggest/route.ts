import { getAuthenticatedUserId } from '@/lib/api-auth';
import { checkRateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const SYSTEM_PROMPT = `You are a language-practice roleplay scenario generator.
Suggest ONE realistic, specific conversational scenario the user can roleplay to practice their target language.

Rules:
- Return ONLY valid JSON, no markdown, no backticks.
- The scenario must be a short, concrete situation (e.g. "Explaining a project deadline delay to my manager"), not a vague topic like "work" or "travel".
- It must be clearly different from the recent scenarios listed — don't repeat one or lightly rephrase it.
- Tailor it to the user's goal and career level when relevant (workplace scenarios for professional goals, everyday scenarios for general learners).
- Output language must match the locale specified — write the scenario description in that language, even though the roleplay conversation itself will be conducted in the target practice language.
- Keep it under 15 words.

JSON schema:
{ "scenario": "string" }`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 });
  }

  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const withinLimit = await checkRateLimit(getRateLimitIdentifier(userId, req), 'roleplay-suggest');
  if (!withinLimit) {
    return NextResponse.json({ error: 'Daily usage limit reached. Please try again tomorrow.' }, { status: 429 });
  }

  const { recentScenarios, targetLanguage, goal, careerLevel, locale } = await req.json();
  const lang = locale === 'de' ? 'German' : locale === 'en' ? 'English' : 'Korean';

  const userPrompt = `Output language: ${lang}
Target practice language: ${targetLanguage ?? 'Not specified'}
User's goal: ${goal ?? 'Not specified'}
User's career level: ${careerLevel ?? 'Not specified'}

Recent roleplay scenarios already practiced (avoid repeating these or close variants):
${Array.isArray(recentScenarios) && recentScenarios.length > 0 ? recentScenarios.map((s: string) => `- ${s}`).join('\n') : 'None yet'}

Suggest ONE new roleplay scenario.`;

  const requestBody = JSON.stringify({
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    // 2.5 Flash's internal "thinking" tokens count against maxOutputTokens
    // before any visible text is produced (confirmed ~300+ thoughtsTokenCount
    // even for this one-line answer) - too tight a budget here truncates the
    // response before the closing brace, which then fails the jsonMatch
    // parse below. Matches coach/suggest's budget for the same reason.
    generationConfig: { temperature: 0.9, maxOutputTokens: 4096 },
  });

  try {
    let res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody,
    });

    if (res.status === 503 || res.status === 429) {
      await sleep(3000);
      res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      });
    }

    if (!res.ok) {
      const errText = await res.text();
      console.error('Gemini roleplay-suggest error:', res.status, errText);
      return NextResponse.json({ error: 'Gemini API error' }, { status: 502 });
    }

    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const raw = parts
      .filter((p: { text?: string }) => typeof p.text === 'string')
      .map((p: { text: string }) => p.text)
      .join('');

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON, raw:', raw);
      return NextResponse.json({ error: 'Invalid AI response' }, { status: 502 });
    }

    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (e) {
    console.error('Roleplay suggest route error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
