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
    const context = `Course: ${input.course}\nCurrent topic: ${input.topic}\nCurrent mastery on this topic: ${input.mastery}%\nAuthoritative learning path: ${input.learningPath.join(' -> ')}`;
    const reply = await callLlm({
      system: CHAT_SYSTEM_PROMPT,
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
