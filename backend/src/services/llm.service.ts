import Anthropic from '@anthropic-ai/sdk';

// Verified against Anthropic's live model documentation on the day this
// was written: claude-sonnet-5 is the current balanced/everyday-use model
// (see https://platform.claude.com/docs/en/about-claude/models/overview).
// Anthropic ships new model generations regularly - re-check that page
// before your final submission in case the identifier has moved on.
const MODEL = 'claude-sonnet-5';

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key.');
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

const PERSONALIZE_SYSTEM_PROMPT = `You are the Adaptive Learning Path AI, an educational learning assistant.

The Adaptive Learning Engine has already determined the student's weak topics and authoritative learning path. Both are provided to you below as ground truth - you are NOT responsible for predicting the student's overall performance, and you must NOT invent, reorder, or second-guess the learning path, any topic name, or any mastery score.

Your job is to personalize the learning experience around the path you are given. You may:
- explain concepts simply
- create study guidance and a time-boxed plan
- suggest practice activities
- provide examples
- adjust explanation difficulty to the student's level
- explain why each topic is included (referencing the actual mastery data given)

Base your response only on the provided course, topics, mastery data, and learning path. Do not claim to know anything that was not provided to you.

Return VALID JSON ONLY, no markdown fences, no preamble, matching exactly this shape:
{
  "summary": "<2-3 sentence plain-language summary>",
  "todaysPlan": [
    { "activity": "<short activity description>", "minutes": <number> }
  ],
  "topicGuidance": [
    { "topic": "<topic name, must exactly match one of the provided learning path topics>", "whyItMatters": "<one sentence>", "howToApproach": "<one or two sentences>" }
  ],
  "encouragement": "<one genuine, specific sentence>"
}`;

const CHAT_SYSTEM_PROMPT = `You are the Adaptive Learning Path AI, a contextual learning assistant embedded in an adaptive learning app.

You know the student's current course, current topic, their mastery level on that topic, and the authoritative learning path (determined by a separate deterministic engine, which you must never contradict or reorder).

Answer the student's question directly and simply, calibrated to their stated mastery level. If the student asks something unrelated to their current learning context, gently redirect them back toward their learning goal. Do not invent facts about the student beyond what is given to you below.

Respond in plain text (not JSON) - a normal, warm, helpful reply.`;

function extractJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?/, '').replace(/```$/, '').trim();
  return JSON.parse(cleaned);
}

export interface PersonalizeInput {
  course: string;
  weakTopics: { name: string; mastery: number }[];
  learningPath: string[];
  studyTimeMinutes: number;
  learningPreference: string;
  goal: string;
}

export interface PersonalizeResult {
  success: boolean;
  source: 'llm' | 'fallback';
  data: unknown;
  error?: string;
}

export async function personalize(input: PersonalizeInput): Promise<PersonalizeResult> {
  try {
    const anthropic = getClient();
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: PERSONALIZE_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: JSON.stringify(input, null, 2) }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('LLM response contained no text block');
    }
    const data = extractJson(textBlock.text);
    return { success: true, source: 'llm', data };
  } catch (err) {
    // The core adaptive path must keep working even if the LLM is down -
    // this is an explicit requirement (Section 20). We degrade to a
    // clearly-labeled fallback rather than crashing or hiding the failure.
    return {
      success: false,
      source: 'fallback',
      error: err instanceof Error ? err.message : String(err),
      data: {
        summary: 'AI personalization is temporarily unavailable. Here is your learning path in the order the Adaptive Engine determined.',
        todaysPlan: input.learningPath.slice(0, 3).map((topic) => ({ activity: `Study: ${topic}`, minutes: Math.round(input.studyTimeMinutes / 3) })),
        topicGuidance: input.learningPath.map((topic) => ({ topic, whyItMatters: 'Part of your current learning path.', howToApproach: 'Review the fundamentals, then attempt practice questions.' })),
        encouragement: 'Keep going - steady practice on your weak topics will pay off.',
      },
    };
  }
}

export interface ChatInput {
  course: string;
  topic: string;
  mastery: number;
  learningPath: string[];
  message: string;
}

export interface ChatResult {
  success: boolean;
  source: 'llm' | 'fallback';
  reply: string;
  error?: string;
}

export async function chat(input: ChatInput): Promise<ChatResult> {
  try {
    const anthropic = getClient();
    const context = `Course: ${input.course}\nCurrent topic: ${input.topic}\nCurrent mastery on this topic: ${input.mastery}%\nAuthoritative learning path: ${input.learningPath.join(' -> ')}`;
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 700,
      system: CHAT_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `${context}\n\nStudent's message: ${input.message}` }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const reply = textBlock && textBlock.type === 'text' ? textBlock.text : '';
    if (!reply) throw new Error('LLM response contained no text block');
    return { success: true, source: 'llm', reply };
  } catch (err) {
    return {
      success: false,
      source: 'fallback',
      error: err instanceof Error ? err.message : String(err),
      reply: "Sorry, the AI assistant is temporarily unavailable right now. Please try again in a moment.",
    };
  }
}
