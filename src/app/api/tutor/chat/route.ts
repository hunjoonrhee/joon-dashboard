import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';

const buildSystemPrompt = (userContext: {
  careerLevel: string;
  recentTags: string[];
  gapSkills: string[];
  projects: string[];
  goal: string;
  tilHistory: string[];
}) => {
  const domain = detectDomain(userContext.goal, userContext.recentTags);

  return `You are an active, intelligent 1:1 tutor. You are NOT a passive Q&A bot.
Your job is to LEAD the learning session — analyze the user's level in real time and decide what to teach next.

User context:
- Career level / background: ${userContext.careerLevel}
- Learning goal: ${userContext.goal}
- Domain: ${domain}
- Recently studied tags: ${userContext.recentTags.slice(0, 10).join(', ') || 'None yet'}
- Skill gaps: ${userContext.gapSkills.slice(0, 8).join(', ') || 'Unknown'}
- Active projects: ${domain === 'language' ? 'N/A (not relevant for language learning)' : userContext.projects.join(', ')}
- Previous session notes (TIL): ${userContext.tilHistory.length > 0 ? userContext.tilHistory.join(' | ') : 'None'}

Core teaching rules:
- Analyze every user message to assess their current understanding level.
- If user seems to understand well → deepen or move to next concept.
- If user seems confused or asks basic questions → slow down and explain differently.
- NEVER repeat what the user already knows from their background/recent tags.
- Connect new concepts to what they already know ("You know RxJS — Signals work similarly but...")
- Reference their actual projects when giving examples.
- Be concise — max 100 words per explanation unless complexity requires more.
- Output language must match the locale specified.

${getDomainRules(domain)}

Session control:
- Keep the session going as long as the user wants. Do NOT auto-terminate.
- Only generate [SUMMARY] when the user explicitly requests to end the session.
- When user ends session, generate: [SUMMARY]{"concepts":["concept1"],"tags":["tag1"],"tilNote":"one sentence summary of what was covered and any gaps noticed"}[/SUMMARY]`;
};

function detectDomain(goal: string, tags: string[]): string {
  const goalLower = goal.toLowerCase();

  // goal 먼저 체크
  if (
    /angular|react|vue|typescript|javascript|python|java|coding|developer|architect|frontend|backend|fullstack/.test(
      goalLower
    )
  )
    return 'development';
  if (
    /deutsch|german|english|korean|japanese|french|spanish|language|sprache|vocabulary|grammar|회화|마스터/.test(
      goalLower
    )
  )
    return 'language';
  if (/abitur|수능|exam|prüfung|certificate|certification|pmp|cfa|ielts|toefl|goethe|telc/.test(goalLower))
    return 'exam';
  if (/writing|작문|essay|blog|copywriting|schreiben/.test(goalLower)) return 'writing';

  // goal로 판단 안 되면 tags 체크
  const tagStr = tags.join(' ').toLowerCase();
  if (/angular|react|vue|typescript|javascript|python|java|coding/.test(tagStr)) return 'development';
  if (/deutsch|german|english|korean|japanese|french|spanish|language/.test(tagStr)) return 'language';

  return 'general';
}

function getDomainRules(domain: string): string {
  switch (domain) {
    case 'development':
      return `Domain: Software Development
- ALWAYS use real code examples. Never explain without code.
- Ask open-ended questions, NOT multiple choice. ("Why would you use X here?" / "What's wrong with this code?")
- When user shares code → immediately review it: correctness, best practices, performance, readability.
- Progress path: concept intro with code → user question/code → assess understanding → deepen or pivot.
- Quiz format: code snippet with a question, not multiple choice.`;

    case 'language':
      return `Domain: Language Learning
      - DO NOT reference the user's software projects or technical work in examples.
- Use real-life situations: workplace conversations, daily life, social interactions.
- When user writes a sentence/paragraph → correct it immediately with explanation of WHY.
- Show natural alternatives ("More natural way to say this: ...")
- Teach through real situations: workplace, daily life, specific scenarios.
- Practice formats: sentence correction, translation, fill-in-the-blank, roleplay.
- Multiple choice OK for grammar rules, but prefer open-ended production tasks.
- If goal is conversation → do roleplay: take on a character and have a real dialogue.`;

    case 'exam':
      return `Domain: Exam Preparation
- Use real exam-style questions appropriate to the target exam.
- After wrong answers: explain why, show the correct reasoning process.
- Track weak areas within the session and circle back to them.
- Multiple choice IS appropriate here — mirrors the actual exam format.
- Give time estimates and strategy tips relevant to the exam.`;

    case 'writing':
      return `Domain: Writing / Composition
- When user shares text → provide detailed feedback: structure, clarity, style, flow.
- Show before/after examples.
- Ask user to revise based on feedback.
- Focus on the user's specific writing goal (blog, essay, script, etc).`;

    default:
      return `Domain: General
- Adapt your teaching style based on the user's responses.
- Use examples relevant to their background and goals.
- Mix explanation and interactive questioning.`;
  }
}

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
  tilHistory: string[];
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 });
  }

  const { topic, messages, locale, userContext, requestSummary } = await req.json();
  const lang = locale === 'de' ? 'German' : locale === 'en' ? 'English' : 'Korean';

  const context: UserContext = userContext ?? {
    careerLevel: 'Unknown',
    recentTags: [],
    gapSkills: [],
    projects: [],
    goal: topic,
    tilHistory: [],
  };

  const history: Message[] = messages ?? [];

  let contents: Message[];

  if (requestSummary) {
    // 세션 종료 요청 — 요약 생성
    contents = [
      ...history,
      {
        role: 'user',
        parts: [
          {
            text: `Output language: ${lang}\n\nThe user is ending the session now. Please provide a [SUMMARY] of what was covered, what concepts were learned, relevant tags, and a brief tilNote about any gaps or areas to revisit.`,
          },
        ],
      },
    ];
  } else if (history.length === 0) {
    // 첫 메시지 — 세션 시작
    contents = [
      {
        role: 'user',
        parts: [
          {
            text: `Output language: ${lang}\n\nTeach me about: ${topic}\n\nStart by briefly assessing what I might already know based on my background, then begin teaching at the right level.`,
          },
        ],
      },
    ];
  } else {
    contents = history;
  }

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: buildSystemPrompt(context) }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 1500 },
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

    // 퀴즈 파싱 (시험 도메인용)
    const quizMatch = raw.match(/\[QUIZ\]([\s\S]*?)\[\/QUIZ\]/);
    const quiz = quizMatch ? JSON.parse(quizMatch[1]) : null;

    // SUMMARY 파싱
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
