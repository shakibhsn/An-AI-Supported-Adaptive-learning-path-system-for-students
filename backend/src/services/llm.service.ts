/**
 * LLM integration layer.
 *
 * PROVIDER-AGNOSTIC. Controlled by env var LLM_PROVIDER:
 *   - "xai"       (default) -> xAI / Grok, via its OpenAI-compatible REST API
 *   - "anthropic"           -> Anthropic Claude, via @anthropic-ai/sdk
 *
 * The rest of the app (controllers) never sees the provider - it only calls
 * personalize() and chat(). Swapping providers is one env var.
 *
 * ARCHITECTURAL ROLE (do not change): the LLM does NOT decide the learning
 * path. adaptiveEngine.service.ts produces the authoritative topic sequence;
 * the LLM only personalizes explanations and study guidance around it, and
 * the system prompts below explicitly forbid it from reordering anything.
 */

import Anthropic from '@anthropic-ai/sdk';

type Provider = 'xai' | 'anthropic';

function getProvider(): Provider {
  const p = (process.env.LLM_PROVIDER || 'xai').toLowerCase();
  return p === 'anthropic' ? 'anthropic' : 'xai';
}

// --- xAI / Grok config -------------------------------------------------------
// xAI's API is OpenAI-compatible. Model list: https://docs.x.ai/docs/models
const XAI_BASE_URL = process.env.XAI_BASE_URL || 'https://api.x.ai/v1';
const XAI_MODEL = process.env.XAI_MODEL || 'grok-3';

// --- Anthropic config ------------------------------------------------------
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';
let anthropicClient: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set. Add it to .env or set LLM_PROVIDER=xai.');
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

// --- unified call ----------------------------------------------------------

interface LlmRequest {
  system: string;
  user: string;
  maxTokens: number;
  /** Ask the provider to return strict JSON (used by personalize()). */
  jsonMode?: boolean;
}

/**
 * Makes one non-streaming completion call to the configured provider and
 * returns the assistant's text. Throws on any transport/auth/shape error -
 * callers are responsible for the graceful fallback (see personalize/chat).
 */
async function callLlm(req: LlmRequest): Promise<string> {
  return getProvider() === 'anthropic' ? callAnthropic(req) : callXai(req);
}

async function callXai(req: LlmRequest): Promise<string> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error('XAI_API_KEY is not set. Get one at https://console.x.ai and add it to .env.');
  }

  const res = await fetch(`${XAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: XAI_MODEL,
      messages: [
        { role: 'system', content: req.system },
        { role: 'user', content: req.user },
      ],
      max_tokens: req.maxTokens,
      temperature: 0.4,
      ...(req.jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`xAI API error ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('xAI response contained no message content');
  return text;
}

async function callAnthropic(req: LlmRequest): Promise<string> {
  const anthropic = getAnthropic();
  const response = await anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: req.maxTokens,
    system: req.system,
    messages: [{ role: 'user', content: req.user }],
  });
  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Anthropic response contained no text block');
  }
  return textBlock.text;
}

// --- prompts --------------------------------------------------------------

const PERSONALIZE_SYSTEM_PROMPT = `You are StudyGuard AI, an educational learning assistant.

The Adaptive Learning Engine has already determined the student's weak topics and authoritative learning path. Both are provided to you below as ground truth - you are NOT responsible for predicting the student's overall performance, and you must NOT invent, reorder, or second-guess the learning path, any topic name, or any mastery score.

Your job is to personalize the learning experience around the path you are given. You may:
- explain concepts simply
- create study guidance and a time-boxed plan
- suggest practice activities
- provide examples
- adjust explanation difficulty to the student's level
- explain why each topic is included (referencing the actual mastery data given)
- recommend which of the provided learning materials are most useful for each weak topic (you may ONLY reference materials that appear in the provided list - never invent a resource, title, or URL)

Base your response only on the provided course, topics, mastery data, learning path, and materials. Do not claim to know anything that was not provided to you.

Return VALID JSON ONLY, no markdown fences, no preamble, matching exactly this shape:
{
  "summary": "<2-3 sentence plain-language summary>",
  "todaysPlan": [
    { "activity": "<short activity description>", "minutes": <number> }
  ],
  "topicGuidance": [
    { "topic": "<topic name, must exactly match one of the provided learning path topics>", "whyItMatters": "<one sentence>", "howToApproach": "<one or two sentences>", "recommendedMaterialTitles": ["<title copied verbatim from the provided materials list, or omit if none provided>"] }
  ],
  "encouragement": "<one genuine, specific sentence>"
}`;

const CHAT_SYSTEM_PROMPT = `You are StudyGuard AI, a contextual learning assistant embedded in an adaptive learning app.

You know the student's current course, current topic, their mastery level on that topic, and the authoritative learning path (determined by a separate deterministic engine, which you must never contradict or reorder).

Answer the student's question directly and simply, calibrated to their stated mastery level. If the student asks something unrelated to their current learning context, gently redirect them back toward their learning goal. Do not invent facts about the student beyond what is given to you below.

Respond in plain text (not JSON) - a normal, warm, helpful reply.`;

// Appended to CHAT_SYSTEM_PROMPT when the student picks an explanation style
// (Section 13 - "Explain at my level").
const CHAT_STYLE_INSTRUCTIONS: Record<string, string> = {
  simple: 'The student asked for a SIMPLE explanation: use short sentences, everyday analogies, and avoid jargon. Assume this is their first real exposure to the idea.',
  detailed: 'The student asked for a DETAILED explanation: cover the underlying mechanism thoroughly, including edge cases and why it works the way it does.',
  example: 'The student asked for an EXAMPLE: lead with a concrete, worked example (with code if the course is DSA/OOP/SPL) before any abstract explanation.',
  step_by_step: 'The student asked for a STEP-BY-STEP walkthrough: number each step in order, and keep each step to one clear action or idea.',
};

// Randomized Adaptive Assessment (Section 7/short-answer scoring): evaluates
// a single SHORT_ANSWER/PROBLEM_SOLVING response against an expected-concept
// rubric. Additive use of the SAME callLlm/provider transport already used
// by personalize/chat/analyzeProgress above - no new provider, no change to
// those three functions.
const SHORT_ANSWER_EVAL_SYSTEM_PROMPT = `You are grading a student's short written answer to a computer science question, against a rubric of expected concepts.

Score strictly based on how many of the expected concepts the student's answer actually demonstrates understanding of - do not reward answers that merely restate the question, and do not penalize different wording that still conveys the same concept.

Return VALID JSON ONLY, no markdown fences, no preamble, matching exactly this shape:
{
  "earnedScore": <number, 0 to maxScore, may be fractional>,
  "matchedConcepts": ["<expected concept the answer demonstrated>"],
  "feedback": "<one or two sentence, specific, constructive feedback to the student>"
}`;

const PROGRESS_ANALYSIS_SYSTEM_PROMPT = `You are StudyGuard AI, analyzing a student's real, backend-supplied learning data.

You will receive actual stored numbers: topic mastery percentages, learning activity minutes by category, practice accuracy, and follow-up assessment results. This is the complete and only truth about the student - you have no other information.

STRICT RULES:
- Never invent a score, a duration, a topic name, or any statistic not present in the data given to you.
- Never claim the student did something (e.g. "watched a video") unless an activity record says so.
- If a field is null or missing, say there isn't enough data yet for that part - do not guess a plausible-sounding number.
- Reference the actual numbers you were given (e.g. "your practice accuracy is 72%"), don't just gesture vaguely at "good progress".

Your job: analyze the pattern across topics/activity/performance and write a short, encouraging, honest progress insight - noting what improved, what still needs attention, and a concrete next step. 3-5 sentences, plain text (not JSON).`;

function extractJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?/, '').replace(/```$/, '').trim();
  return JSON.parse(cleaned);
}

// --- personalize ---------------------------------------------------------

export interface PersonalizeMaterial {
  title: string;
  type: string;
  topic: string;
  url: string;
}

export interface PersonalizeInput {
  course: string;
  weakTopics: { name: string; mastery: number }[];
  learningPath: string[];
  studyTimeMinutes: number;
  learningPreference: string;
  goal: string;
  /** Curated materials the backend retrieved for the weak topics (Section 18). */
  availableMaterials?: PersonalizeMaterial[];
}

export interface PersonalizeResult {
  success: boolean;
  source: 'llm' | 'fallback';
  data: unknown;
  error?: string;
}

export async function personalize(input: PersonalizeInput): Promise<PersonalizeResult> {
  try {
    const text = await callLlm({
      system: PERSONALIZE_SYSTEM_PROMPT,
      user: JSON.stringify(input, null, 2),
      maxTokens: 1500,
      jsonMode: true,
    });
    const data = extractJson(text);
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
        topicGuidance: input.learningPath.map((topic) => ({
          topic,
          whyItMatters: 'Part of your current learning path.',
          howToApproach: 'Review the fundamentals, then attempt practice questions.',
          recommendedMaterialTitles: (input.availableMaterials || []).filter((m) => m.topic === topic).map((m) => m.title),
        })),
        encouragement: 'Keep going - steady practice on your weak topics will pay off.',
      },
    };
  }
}

// --- chat --------------------------------------------------------------

export type ChatStyle = 'simple' | 'detailed' | 'example' | 'step_by_step';

export interface ChatInput {
  course: string;
  topic: string;
  mastery: number;
  learningPath: string[];
  message: string;
  /** "Explain at my level" style toggle (Section 13). Optional - plain chat if omitted. */
  style?: ChatStyle;
  /** Recent performance context (Section 13's "recent performance" requirement), server-derived. */
  recentPerformance?: string;
}

export interface ChatResult {
  success: boolean;
  source: 'llm' | 'fallback';
  reply: string;
  error?: string;
}

export async function chat(input: ChatInput): Promise<ChatResult> {
  try {
    const context = [
      `Course: ${input.course}`,
      `Current topic: ${input.topic}`,
      `Current mastery on this topic: ${input.mastery}%`,
      `Authoritative learning path: ${input.learningPath.join(' -> ')}`,
      input.recentPerformance ? `Recent performance: ${input.recentPerformance}` : null,
    ].filter(Boolean).join('\n');

    const system = input.style && CHAT_STYLE_INSTRUCTIONS[input.style]
      ? `${CHAT_SYSTEM_PROMPT}\n\n${CHAT_STYLE_INSTRUCTIONS[input.style]}`
      : CHAT_SYSTEM_PROMPT;

    const reply = await callLlm({
      system,
      user: `${context}\n\nStudent's message: ${input.message}`,
      maxTokens: 700,
    });
    if (!reply.trim()) throw new Error('LLM response was empty');
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

// --- progress analysis ("Analyze My Progress" / AI Learning Insight) -----
// Sections 8/14: the caller must pass only real, backend-queried numbers -
// this function does not query the database itself, by design, so it's
// impossible to accidentally leak unvetted data into the prompt.

export interface ProgressAnalysisInput {
  course: string;
  topics: {
    topic: string;
    masteryPercentage: number | null;
    status: string;
    activityMinutes: number | null;
    practiceAccuracy: number | null;
    followUpScore: number | null;
    improvement: number | null;
  }[];
  activityThisWeekMinutes: number;
}

export interface ProgressAnalysisResult {
  success: boolean;
  source: 'llm' | 'fallback';
  analysis: string;
  error?: string;
}

export interface ShortAnswerEvalInput {
  question: string;
  studentAnswer: string;
  expectedConcepts: string[];
  maxScore: number;
}

export interface ShortAnswerEvalResult {
  success: boolean;
  source: 'llm' | 'fallback';
  earnedScore: number;
  matchedConcepts: string[];
  feedback: string;
  error?: string;
}

export async function evaluateShortAnswer(input: ShortAnswerEvalInput): Promise<ShortAnswerEvalResult> {
  try {
    const text = await callLlm({
      system: SHORT_ANSWER_EVAL_SYSTEM_PROMPT,
      user: JSON.stringify(input, null, 2),
      maxTokens: 300,
      jsonMode: true,
    });
    const data = extractJson(text) as { earnedScore?: number; matchedConcepts?: string[]; feedback?: string };
    const earnedScore = Math.max(0, Math.min(input.maxScore, Number(data.earnedScore) || 0));
    return {
      success: true,
      source: 'llm',
      earnedScore,
      matchedConcepts: Array.isArray(data.matchedConcepts) ? data.matchedConcepts : [],
      feedback: data.feedback || '',
    };
  } catch (err) {
    // Section 7: an AI failure must never break the assessment - the
    // controller falls back to keywordFallbackScore() (assessment.service.ts)
    // when success is false, so this branch just reports the failure honestly.
    return {
      success: false,
      source: 'fallback',
      earnedScore: 0,
      matchedConcepts: [],
      feedback: '',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function analyzeProgress(input: ProgressAnalysisInput): Promise<ProgressAnalysisResult> {
  try {
    const analysis = await callLlm({
      system: PROGRESS_ANALYSIS_SYSTEM_PROMPT,
      user: JSON.stringify(input, null, 2),
      maxTokens: 500,
    });
    if (!analysis.trim()) throw new Error('LLM response was empty');
    return { success: true, source: 'llm', analysis };
  } catch (err) {
    const strongest = [...input.topics].filter((t) => t.masteryPercentage !== null).sort((a, b) => (b.masteryPercentage ?? 0) - (a.masteryPercentage ?? 0))[0];
    const weakest = [...input.topics].filter((t) => t.masteryPercentage !== null).sort((a, b) => (a.masteryPercentage ?? 0) - (b.masteryPercentage ?? 0))[0];
    return {
      success: false,
      source: 'fallback',
      error: err instanceof Error ? err.message : String(err),
      analysis: [
        'AI progress analysis is temporarily unavailable, so here is a plain summary of your stored data.',
        strongest ? `Your strongest topic is ${strongest.topic} at ${strongest.masteryPercentage}% mastery.` : null,
        weakest && weakest.topic !== strongest?.topic ? `${weakest.topic} is your lowest at ${weakest.masteryPercentage}% - consider focusing there next.` : null,
        `You've logged ${input.activityThisWeekMinutes} minutes of learning activity this week.`,
      ].filter(Boolean).join(' '),
    };
  }
}
