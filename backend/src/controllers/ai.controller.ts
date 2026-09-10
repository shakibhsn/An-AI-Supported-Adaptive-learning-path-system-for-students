import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import * as llm from '../services/llm.service';

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
  const { courseId, topic, mastery, learningPath, message } = req.body;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return res.status(404).json({ error: 'Course not found' });

  const topicRow = await prisma.topic.findFirst({ where: { courseId, name: topic } });

  const result = await llm.chat({
    course: course.code,
    topic,
    mastery: mastery ?? 0,
    learningPath: learningPath ?? [],
    message,
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

  return res.json(result);
}
