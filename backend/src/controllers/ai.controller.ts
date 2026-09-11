import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import * as llm from '../services/llm.service';
import { getActivitySummary } from '../services/activity.service';

export async function personalize(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { courseId, weakTopics, learningPath, studyTimeMinutes, learningPreference, goal } = req.body;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return res.status(404).json({ error: 'Course not found' });

  // Section 18: retrieve the trusted materials for the path's topics and hand
  // them to the LLM. The LLM may recommend from this list but never invent one.
  const pathTopicNames: string[] = Array.isArray(learningPath) ? learningPath : [];
  const materialRows = pathTopicNames.length
    ? await prisma.learningMaterial.findMany({
        where: { courseId, isActive: true, topic: { name: { in: pathTopicNames } } },
        include: { topic: { select: { name: true } } },
        orderBy: { sortOrder: 'asc' },
      })
    : [];
  const availableMaterials = materialRows.map((m) => ({
    title: m.title,
    type: m.type,
    topic: m.topic.name,
    url: m.url,
  }));

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
    courseId: string; topic: string; mastery?: number; learningPath?: string[]; message: string; style?: llm.ChatStyle;
  };

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

  const result = await llm.chat({
    course: course.code,
    topic,
    mastery: realMastery,
    learningPath: realLearningPath,
    message,
    style,
    recentPerformance,
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
  const { courseId } = req.body as { courseId: string };
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
