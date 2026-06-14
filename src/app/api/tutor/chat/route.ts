import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent';

const buildSystemPrompt = (userContext: {
  careerLevel: string;
  recentTags: string[];
  gapSkills: string[];
  projects: string[];
  goal: string;
}) => `You are a personal 1:1 AI tutor. Your job is to teach a specific topic to THIS specific user.

User context:
- Career level: ${userContext.careerLevel}
- Learning goal: ${userContext.goal}
- Recently studied: ${userContext.recentTags.slice(0, 10).join(', ')}
- Skill gaps: ${userContext.gapSkills.slice(0, 8).join(', ')}
- Active projects: ${userContext.projects.join(', ')}

Teaching rules:
- NEVER explain basics the user already knows from their career level and recent study tags.
- Connect new concepts to what they already know (e.g. "You know RxJS — Signals work similarly but...")
- Reference their actual projects when giving examples (e.g. "In your Growpath project, you could use this by...")
- Start at the RIGHT level — a 4-year experienced dev doesn't need "what is a variable" explanations.
- Keep explanations under 80 words unless the topic is complex.
- After each concept, ask ONE targeted quiz question that matches their level.
- Format quizzes as JSON: [QUIZ]{"question":"...","options":["A","B","C","D"],"correct":1}[/QUIZ] (0-indexed)
- When correct: praise briefly and move to the next concept.
- When incorrect: explain why and give another chance.
- After covering 3-5 concepts, provide a session summary: [SUMMARY]{"concepts":["concept1","concept2"],"tags":["tag1","tag2"]}[/SUMMARY]
- Output language must match the locale specified.`;

interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface UserContext {
  careerLevel: string;
  recentTags: string[];
  gapSkills: string[];
  projects: string[];
  goal: string;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 });
  }

  const { topic, messages, locale, userContext } = await req.json();
  const lang = locale === 'de' ? 'German' : locale === 'en' ? 'English' : 'Korean';

  const context: UserContext = userContext ?? {
    careerLevel: 'Unknown',
    recentTags: [],
    gapSkills: [],
    projects: [],
    goal: topic,
  };

  const history: Message[] = messages ?? [];

  const contents: Message[] =
    history.length === 0
      ? [
          {
            role: 'user',
            parts: [
              {
                text: `Output language: ${lang}\n\nTeach me about: ${topic}\n\nStart with a brief explanation tailored to my level, then quiz me.`,
              },
            ],
          },
        ]
      : history;

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: buildSystemPrompt(context) }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Gemini tutor error:', res.status, errText);
      return NextResponse.json({ error: 'Gemini API error' }, { status: 502 });
    }

    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const raw = parts
      .filter((p: { text?: string }) => typeof p.text === 'string')
      .map((p: { text: string }) => p.text)
      .join('');

    const quizMatch = raw.match(/\[QUIZ\]([\s\S]*?)\[\/QUIZ\]/);
    const quiz = quizMatch ? JSON.parse(quizMatch[1]) : null;

    const summaryMatch = raw.match(/\[SUMMARY\]([\s\S]*?)\[\/SUMMARY\]/);
    const summary = summaryMatch ? JSON.parse(summaryMatch[1]) : null;

    const text = raw
      .replace(/\[QUIZ\][\s\S]*?\[\/QUIZ\]/g, '')
      .replace(/\[SUMMARY\][\s\S]*?\[\/SUMMARY\]/g, '')
      .trim();

    return NextResponse.json({ text, quiz, summary });
  } catch (e) {
    console.error('Tutor route error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
