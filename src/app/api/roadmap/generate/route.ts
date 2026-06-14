import type { RoadmapStage } from '@/types';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';

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
- For technical domains: always reflect the CURRENT latest version of frameworks and tools (e.g. Angular Signals instead of Zone.js, React hooks instead of class components). Do not include outdated APIs or deprecated patterns.
- If the current level mentions a specific framework (e.g. Angular, React, Vue), the first 1-2 stages must include that framework's latest core concepts and sub-features as skills and tags.

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
}`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 });
  }

  // Service role 클라이언트 — RLS 우회, user_id 직접 주입
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { goal, careerLevel, locale, userId } = await req.json();
  const lang = locale === 'de' ? 'German' : locale === 'en' ? 'English' : 'Korean';

  if (!goal || !careerLevel) {
    return NextResponse.json({ error: 'goal and careerLevel are required' }, { status: 400 });
  }

  const userPrompt = `Current level: ${careerLevel}
Final goal: ${goal}
Output language: ${lang}

Generate a learning roadmap from the current level to the final goal. Adapt the content naturally to the domain (e.g. programming, language learning, music, design, etc.). All stage titles, skill names, and descriptions must be written in ${lang}. Tags must always be in English.`;

  const requestBody = JSON.stringify({
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 32768 },
  });

  try {
    let geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody,
    });

    if (geminiRes.status === 503 || geminiRes.status === 429) {
      await sleep(3000);
      geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      });
    }

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      console.error('Gemini error:', err);
      return NextResponse.json({ error: 'Gemini API error' }, { status: 502 });
    }

    const geminiData = await geminiRes.json();
    const parts = geminiData.candidates?.[0]?.content?.parts ?? [];
    const raw =
      parts
        .filter((p: { text?: string }) => typeof p.text === 'string')
        .map((p: { text: string }) => p.text)
        .join('') ?? '';

    console.log('Gemini raw:', raw.slice(0, 300));

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in raw:', raw);
      return NextResponse.json({ error: 'Invalid AI response', raw: raw.slice(0, 500) }, { status: 502 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const stages: RoadmapStage[] = parsed.stages;

    // 비회원 체험 — DB 저장 스킵
    if (!userId) {
      return NextResponse.json({ stages });
    }

    const { data, error } = await supabaseAdmin
      .from('ai_roadmaps')
      .insert({
        goal,
        career_level: careerLevel,
        stages,
        adopted: false,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'DB save failed' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error('Route error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
