import { getAuthenticatedUserId } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

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

function detectDomain(goal: string, tags: string[]): string {
  const goalLower = goal.toLowerCase();
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

  const tagStr = tags.join(' ').toLowerCase();
  if (/angular|react|vue|typescript|javascript|python|java|coding/.test(tagStr)) return 'development';
  if (/deutsch|german|english|korean|japanese|french|spanish|language/.test(tagStr)) return 'language';

  return 'general';
}

function getDomainRules(domain: string, targetLanguage: string | null, lang: string): string {
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
${
  targetLanguage
    ? `- The user is practicing ${targetLanguage}. Any roleplay dialogue, example sentences, and vocabulary must be written in ${targetLanguage} - this is the whole point of the practice. Corrections, grammar explanations, and other meta-commentary go in the output language specified above, not in ${targetLanguage}.
- Wrap every complete sentence written in ${targetLanguage} in [DIALOGUE][/DIALOGUE] tags - this includes in-character roleplay lines AND any ${targetLanguage} example or corrected sentence you write (e.g. showing the user a fixed version of what they said). Only the ${lang} explanation text around it stays outside the tags. Example: [DIALOGUE]Guten Tag, was möchten Sie bestellen?[/DIALOGUE]. This lets the app read every ${targetLanguage} sentence aloud - including corrections, which the user needs to hear pronounced correctly - without also reading your ${lang} commentary in the wrong voice.`
    : ''
}
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

const buildSystemPrompt = (userContext: UserContext, targetLanguage: string | null, lang: string) => {
  // detectDomain() keys off userContext.goal, which is the caller's active
  // *roadmap* goal - unrelated to what this specific chat session is about.
  // A user can have a dev-career roadmap adopted while still opening a
  // language-roleplay session, so goal-text sniffing would miss it entirely
  // (the whole point of this session) - targetLanguage being set is a
  // direct, unambiguous signal that this is a language session, so it
  // short-circuits the heuristic instead of being just another guess.
  const domain = targetLanguage ? 'language' : detectDomain(userContext.goal, userContext.recentTags);

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
- ${
  targetLanguage
    ? `Output language is split by role, on every turn of this conversation: in-character roleplay dialogue must be in ${targetLanguage}; everything else (corrections, explanations, meta-commentary) must be in ${lang}. This split applies for the entire session, not just the opening turn. Additionally, wrap every ${targetLanguage} sentence (dialogue lines AND example/corrected sentences) in [DIALOGUE][/DIALOGUE] tags on every turn - see the Language Learning domain rules below for the exact format.`
    : `Output language must be ${lang}.`
}

${getDomainRules(domain, targetLanguage, lang)}

Session control:
- Keep the session going as long as the user wants. Do NOT auto-terminate.
- Only generate [SUMMARY] when the user explicitly requests to end the session.
- When user ends session, generate: [SUMMARY]{"concepts":["concept1"],"tags":["tag1"],"tilNote":"one sentence summary of what was covered and any gaps noticed"}[/SUMMARY]`;
};

const buildCodeReviewPrompt = (userContext: UserContext): string => {
  return `You are an expert code reviewer with deep knowledge of software architecture and clean code principles.

User context:
- Career level: ${userContext.careerLevel}
- Learning goal: ${userContext.goal}
- Skill gaps: ${userContext.gapSkills.slice(0, 8).join(', ') || 'Unknown'}
- Active projects: ${userContext.projects.join(', ') || 'None'}
- Recent study tags: ${userContext.recentTags.slice(0, 10).join(', ') || 'None'}

Code review rules:
1. **Correctness** — Does it work? Any bugs or edge cases?
2. **Clean Code** — Naming, single responsibility, readability
3. **SOLID principles** — Especially SRP and OCP
4. **Performance** — Any obvious inefficiencies?
5. **Best practices** — Language/framework specific conventions

Review format:
- Start with a one-line overall assessment
- List issues by severity: 🔴 Critical / 🟡 Improvement / 🟢 Suggestion
- For each issue: show the problematic code → explain why → show improved version
- End with what the user did well (positive reinforcement)
- Connect feedback to their learning goal and skill gaps where relevant

Be specific and educational — explain WHY each change is better, not just what to change.
Output language must match the locale specified.`;
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 });
  }

  // No anonymous tutor flow exists in the product (unlike the roadmap
  // generator's trial mode) - every call here spends real Gemini quota, so
  // require a verified session/token rather than leaving this open to
  // anyone who has the URL.
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { topic, messages, locale, userContext, requestSummary, codeReview, code, targetLanguage } = await req.json();
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
  let systemPrompt: string;

  if (codeReview && code) {
    // 코드 리뷰 모드
    systemPrompt = buildCodeReviewPrompt(context);
    contents = [
      ...history.filter((m) => m.parts.length > 0 && m.parts[0].text?.trim()),
      {
        role: 'user',
        parts: [
          {
            text: `Output language: ${lang}\n\nPlease review this code:\n\n\`\`\`\n${code}\n\`\`\``,
          },
        ],
      },
    ];
  } else if (requestSummary) {
    systemPrompt = buildSystemPrompt(context, targetLanguage ?? null, lang);
    contents = [
      ...history.filter((m) => m.parts.length > 0 && m.parts[0].text?.trim()),
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
    systemPrompt = buildSystemPrompt(context, targetLanguage ?? null, lang);
    // "Start by briefly assessing what I might already know" primes a
    // locale-language preamble before anything else happens - fine for
    // regular tutoring, but for roleplay it meant the model would narrate
    // the whole scene in the locale and ask the user to reply in
    // targetLanguage, instead of actually opening in character itself.
    // Cutting that preamble entirely (an earlier version of this fix) swung
    // too far the other way - the in-character line came back generic and
    // impersonal, with no sign the model had taken the user's level/goal
    // into account. This keeps exactly one locale-language sentence for
    // that context, then requires the actual dialogue to be in-character
    // and in targetLanguage.
    const openingTask = targetLanguage
      ? `Output language: ${lang} for corrections/explanations - but the roleplay dialogue itself must be in ${targetLanguage}, since practicing it is the whole point of this session.\n\nScenario: ${topic}\n\nWrite exactly one short sentence in ${lang} that shows you've factored in the user's level/background for this scenario, then immediately open the scene in character with your first line written entirely in ${targetLanguage}, wrapped in [DIALOGUE][/DIALOGUE] tags. Do not narrate the scenario or ask the user to begin in ${lang} - after that one sentence, go straight into character.`
      : `Output language: ${lang}\n\nTeach me about: ${topic}\n\nStart by briefly assessing what I might already know based on my background, then begin teaching at the right level.`;
    contents = [
      {
        role: 'user',
        parts: [
          {
            text: openingTask,
          },
        ],
      },
    ];
  } else {
    systemPrompt = buildSystemPrompt(context, targetLanguage ?? null, lang);
    contents = history.filter((m) => m.parts.length > 0 && m.parts[0].text?.trim());
  }

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          temperature: 0.7,
          // 1500, then 3000, both proved tight enough that a language-domain
          // correction turn - a numbered list of corrections with
          // explanations, PLUS a full corrected rewrite of the user's
          // (sometimes lengthy) paragraph, PLUS an in-character reply, all
          // in one turn - could still hit the cap and get cut off mid-word.
          maxOutputTokens: codeReview ? 8000 : 6000,
        },
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

    // Roleplay turns mix ${targetLanguage} in-character dialogue with
    // ${lang} meta-commentary in one reply (see buildSystemPrompt) - a TTS
    // caller reading the whole thing aloud in one voice mispronounces
    // whichever half doesn't match. dialogueText pulls out just the
    // in-character lines (tags only, content stays in `text` too) so a
    // caller like the mobile app's roleplay screen can read only that part
    // aloud; null when the model didn't use the tag (non-roleplay chat, or
    // an occasional formatting miss - callers should fall back to `text`).
    // The model bolds corrected/emphasized words with markdown (**word**)
    // inside dialogue lines same as everywhere else - harmless for on-screen
    // text, but a TTS engine reads the literal asterisks aloud ("Sternchen").
    // dialogueText is TTS-only, so it strips emphasis markers; `text` (used
    // for display) is untouched and keeps the markdown.
    const stripMarkdownEmphasis = (segment: string) => segment.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');

    const dialogueSegments = [...raw.matchAll(/\[DIALOGUE\]([\s\S]*?)\[\/DIALOGUE\]/g)]
      .map((m) => stripMarkdownEmphasis(m[1].trim()))
      .filter(Boolean);
    const dialogueText = dialogueSegments.length > 0 ? dialogueSegments.join(' ') : null;

    const text = raw
      .replace(/\[QUIZ\][\s\S]*?\[\/QUIZ\]/g, '')
      .replace(/\[SUMMARY\][\s\S]*?\[\/SUMMARY\]/g, '')
      .replace(/\[\/?DIALOGUE\]/g, '')
      .trim();

    return NextResponse.json({ text, quiz, summary, dialogueText });
  } catch (e) {
    console.error('Tutor route error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
