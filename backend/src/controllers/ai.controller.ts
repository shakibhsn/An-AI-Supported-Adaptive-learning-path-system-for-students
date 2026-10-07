import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import * as llm from '../services/llm.service';
import { getActivitySummary } from '../services/activity.service';
import { searchBooksForTopic } from '../services/openLibrary.service';

const MAX_CHAT_MESSAGE_LENGTH = 2000;

export async function personalize(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { courseId, weakTopics, learningPath, studyTimeMinutes, learningPreference, goal } = req.body;

  if (!courseId || typeof courseId !== 'string') return res.status(400).json({ error: 'courseId is required.' });

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return res.status(404).json({ error: 'Course not found' });

  // Section 18 / Phase 5: retrieve the trusted materials AND Open Library
  // books for the path's topics and hand them to the LLM. The LLM may
  // recommend from this list but never invent one (capped to the first 5
  // path topics - this is a plan-generation call, not a per-message chat,
  // so a few extra parallel lookups here are fine; Open Library calls are
  // cheap in practice since searchBooksForTopic caches per course+topic).
  const pathTopicNames: string[] = Array.isArray(learningPath) ? learningPath : [];
  const bookLookupTopics = pathTopicNames.slice(0, 5);
  const [materialRows, bookResults] = await Promise.all([
    pathTopicNames.length
      ? prisma.learningMaterial.findMany({
          where: { courseId, isActive: true, topic: { name: { in: pathTopicNames } } },
          include: { topic: { select: { name: true } } },
          orderBy: { sortOrder: 'asc' },
        })
      : Promise.resolve([]),
    Promise.all(bookLookupTopics.map(async (topicName) => ({
      topicName,
      result: await searchBooksForTopic(course.name, topicName),
    }))),
  ]);
  const availableMaterials = [
    ...materialRows.map((m) => ({ title: m.title, type: m.type, topic: m.topic.name, url: m.url })),
    ...bookResults.flatMap(({ topicName, result }) => result.books.map((b) => ({ title: b.title, type: 'BOOK', topic: topicName, url: b.url }))),
  ];

  const result = await llm.personalize({
    course: course.code,
    weakTopics,
    learningPath,
    studyTimeMinutes: studyTimeMinutes ?? 60,
    learningPreference: learningPreference ?? 'Video + Practice',
    goal: goal ?? `Understand ${course.code} fundamentals`,
    availableMaterials,
  });

  await prisma.aIInteraction.create({
    data: {
      userId: req.user.userId,
      courseId,
      interactionType: 'personalize',
      userMessage: JSON.stringify({ weakTopics, learningPath }),
      aiResponse: JSON.stringify(result),
    },
  });

  return res.json(result);
}

export async function chatEndpoint(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { courseId, topic, mastery, learningPath, message, style } = req.body as {
    courseId?: string; topic?: string; mastery?: number; learningPath?: string[]; message?: string; style?: llm.ChatStyle;
  };

  // Phase 5: basic input validation - the AI must remain usable/predictable
  // for empty and excessively long input, and must not silently proceed
  // with a missing courseId/topic/message (which would previously have
  // produced a confusing downstream error instead of a clear 400).
  if (!courseId || typeof courseId !== 'string') return res.status(400).json({ error: 'courseId is required.' });
  if (!topic || typeof topic !== 'string') return res.status(400).json({ error: 'topic is required.' });
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'message is required.' });
  }
  if (message.length > MAX_CHAT_MESSAGE_LENGTH) {
    return res.status(400).json({ error: `message is too long (max ${MAX_CHAT_MESSAGE_LENGTH} characters).` });
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return res.status(404).json({ error: 'Course not found' });

  const topicRow = await prisma.topic.findFirst({ where: { courseId, name: topic } });

  // Prefer real, server-looked-up data over whatever the client claims
  // (the AI must only see numbers the backend itself verified). Client
  // values are only a fallback for the rare case the student is chatting
  // about a topic before any diagnostic/mastery record exists yet.
  let realMastery = mastery ?? 0;
  let recentPerformance: string | undefined;
  if (topicRow) {
    const masteryRow = await prisma.topicMastery.findUnique({
      where: { userId_topicId: { userId: req.user.userId, topicId: topicRow.id } },
    });
    if (masteryRow) realMastery = masteryRow.masteryPercentage;

    const attempts = await prisma.practiceQuestionAttempt.findMany({
      where: { userId: req.user.userId, topicId: topicRow.id },
      select: { isCorrect: true },
    });
    if (attempts.length > 0) {
      const acc = Math.round((attempts.filter((a) => a.isCorrect).length / attempts.length) * 100);
      recentPerformance = `Practice accuracy on ${topic}: ${acc}% over ${attempts.length} attempts.`;
    }
  }

  let realLearningPath = Array.isArray(learningPath) ? learningPath : [];
  const activePath = await prisma.learningPath.findFirst({
    where: { userId: req.user.userId, courseId, status: 'active' },
    include: { items: { include: { topic: true }, orderBy: { sequenceOrder: 'asc' } } },
  });
  if (activePath) realLearningPath = activePath.items.map((i) => i.topic.name);

  const pathIndex = realLearningPath.indexOf(topic);
  const pathPosition = pathIndex !== -1 && realLearningPath.length > 0
    ? `${pathIndex + 1} of ${realLearningPath.length} in your learning path`
    : undefined;

  // Resource-aware AI (Phase 5): the ONLY resources the model is allowed to
  // reference - real curated materials for this topic plus the Phase 4
  // Open Library integration (through its existing cache, so this costs
  // nothing extra on a repeat question about the same topic).
  const [weakMasteryRows, materialRows, bookResult] = await Promise.all([
    prisma.topicMastery.findMany({
      where: { userId: req.user.userId, courseId, status: { in: ['Weak/Critical', 'Needs Improvement'] }, topicId: { not: topicRow?.id } },
      include: { topic: { select: { name: true } } },
    }),
    topicRow
      ? prisma.learningMaterial.findMany({ where: { topicId: topicRow.id, isActive: true }, take: 5, orderBy: { sortOrder: 'asc' } })
      : Promise.resolve([]),
    topicRow ? searchBooksForTopic(course.name, topicRow.name) : Promise.resolve({ books: [], unavailable: true }),
  ]);

  const weakAreas = weakMasteryRows.map((m) => ({ topic: m.topic.name, mastery: Math.round(m.masteryPercentage) }));
  const availableResources: llm.ChatResource[] = [
    ...materialRows.map((m) => ({ title: m.title, type: m.type, url: m.url, source: 'internal' as const })),
    ...bookResult.books.map((b) => ({ title: b.title, type: 'BOOK', url: b.url, source: 'open_library' as const })),
  ];

  // Completed-activity summary (Phase 5's "completed learning activities"
  // context) - a count/duration, not an invented narrative.
  const [courseActivity, completedMaterialCount] = await Promise.all([
    getActivitySummary(req.user.userId, { courseId, range: 'week' }),
    prisma.materialCompletion.count({ where: { userId: req.user.userId, material: { courseId } } }),
  ]);
  const completedActivitiesSummary = `${completedMaterialCount} material${completedMaterialCount === 1 ? '' : 's'} completed in this course; ${Math.round(courseActivity.totalSeconds / 60)} minutes of activity logged this week.`;

  const result = await llm.chat({
    course: course.code,
    topic,
    mastery: realMastery,
    learningPath: realLearningPath,
    message,
    style,
    recentPerformance,
    weakAreas,
    availableResources,
    completedActivitiesSummary,
    pathPosition,
  });

  await prisma.aIInteraction.create({
    data: {
      userId: req.user.userId,
      courseId,
      topicId: topicRow?.id,
      interactionType: 'chat',
      userMessage: message,
      aiResponse: result.reply,
    },
  });

  await prisma.learningActivity.create({
    data: { userId: req.user.userId, courseId, topicId: topicRow?.id, activityType: 'AI_INTERACTION', source: 'in_app', endedAt: new Date(), durationSeconds: 0 },
  }).catch(() => undefined);

  return res.json(result);
}

// POST /api/ai/analyze-progress  { courseId }  (Sections 8/14 - "Analyze My Progress")
// Assembles ONLY real, backend-queried numbers and hands them to the LLM.
export async function analyzeProgressEndpoint(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { courseId } = req.body as { courseId?: string };
  if (!courseId || typeof courseId !== 'string') return res.status(400).json({ error: 'courseId is required.' });
  const userId = req.user.userId;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return res.status(404).json({ error: 'Course not found' });

  const [topics, masteryRows, followUps, activityWeek] = await Promise.all([
    prisma.topic.findMany({ where: { courseId } }),
    prisma.topicMastery.findMany({ where: { userId, courseId } }),
    prisma.followUpAttempt.findMany({ where: { userId, courseId }, orderBy: { completedAt: 'desc' } }),
    getActivitySummary(userId, { courseId, range: 'week' }),
  ]);

  const masteryByTopicId = new Map(masteryRows.map((m) => [m.topicId, m]));
  const latestFollowUpByTopicId = new Map<string, (typeof followUps)[number]>();
  for (const f of followUps) if (!latestFollowUpByTopicId.has(f.topicId)) latestFollowUpByTopicId.set(f.topicId, f);

  const topicPayload = await Promise.all(
    topics.map(async (t) => {
      const mastery = masteryByTopicId.get(t.id);
      const [activity, attempts] = await Promise.all([
        getActivitySummary(userId, { courseId, topicId: t.id }),
        prisma.practiceQuestionAttempt.findMany({ where: { userId, topicId: t.id }, select: { isCorrect: true } }),
      ]);
      const followUp = latestFollowUpByTopicId.get(t.id);
      return {
        topic: t.name,
        masteryPercentage: mastery?.masteryPercentage ?? null,
        status: mastery?.status ?? 'Not Started',
        activityMinutes: activity.totalSeconds > 0 ? Math.round(activity.totalSeconds / 60) : null,
        practiceAccuracy: attempts.length > 0 ? Math.round((attempts.filter((a) => a.isCorrect).length / attempts.length) * 100) : null,
        followUpScore: followUp?.newMastery ?? null,
        improvement: followUp?.previousMastery != null ? Math.round((followUp.newMastery - followUp.previousMastery) * 10) / 10 : null,
      };
    }),
  );

  // Only send topics the student has actually touched - an empty/untouched
  // topic contributes nothing but noise (and the "don't invent data" rule
  // means the model shouldn't be commenting on topics with no signal at all).
  const touchedTopics = topicPayload.filter((t) => t.masteryPercentage !== null || t.activityMinutes !== null);

  const result = await llm.analyzeProgress({
    course: course.code,
    topics: touchedTopics,
    activityThisWeekMinutes: Math.round(activityWeek.totalSeconds / 60),
  });

  await prisma.aIInteraction.create({
    data: {
      userId,
      courseId,
      interactionType: 'analyze_progress',
      userMessage: JSON.stringify({ topicCount: touchedTopics.length }),
      aiResponse: result.analysis,
    },
  });

  return res.json({ ...result, data: { topics: touchedTopics, activityThisWeekMinutes: Math.round(activityWeek.totalSeconds / 60) } });
}
