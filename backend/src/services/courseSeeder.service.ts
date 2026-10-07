/**
 * Phase 8: the single place that turns a LoadedCourseData (from
 * courseDataLoader.ts) into real database rows - Course, Topic (+
 * prerequisite links), DiagnosticQuestion, PracticeQuestion (practice/
 * follow-up/expanded/assessment all share this table, distinguished by
 * their existing flags), and LearningMaterial.
 *
 * Used by BOTH prisma/seed.ts (wipe-and-recreate, dev-only) and
 * prisma/seedCourses.ts (additive/idempotent) - previously each had its
 * own near-duplicate copy of this insertion logic; this is now the one
 * definition, so neither script needs to change when a new file type or
 * field is added to the course data format.
 */

import type { PrismaClient } from '@prisma/client';
import type { LoadedCourseData } from '../data/courseDataLoader';

export async function seedCourseContent(prisma: PrismaClient, data: LoadedCourseData): Promise<{ courseId: string }> {
  const { meta } = data;

  const course = await prisma.course.create({
    data: { code: meta.code, name: meta.name, description: meta.description },
  });

  // Topics: create all first (no prerequisite links yet - a prerequisite
  // must already have an id to be referenced), then a second pass to wire
  // prerequisiteTopicId now that every topic in this course has one.
  const topicByName: Record<string, { id: string }> = {};
  for (const t of meta.topics) {
    const topic = await prisma.topic.create({ data: { courseId: course.id, name: t.name } });
    topicByName[t.name] = topic;
  }
  for (const t of meta.topics) {
    if (!t.prerequisite) continue;
    const prereq = topicByName[t.prerequisite];
    if (!prereq) {
      console.warn(`WARNING: ${meta.code} topic "${t.name}" declares prerequisite "${t.prerequisite}", which isn't in this course's topic list - skipping that link.`);
      continue;
    }
    await prisma.topic.update({ where: { id: topicByName[t.name].id }, data: { prerequisiteTopicId: prereq.id } });
  }
  console.log(`  ${meta.code}: ${meta.topics.length} topics + prerequisite links.`);

  let diagCount = 0;
  for (const q of data.diagnostic) {
    const topic = topicByName[q.topic];
    if (!topic) { console.warn(`WARNING: no topic "${q.topic}" in ${meta.code} - skipping diagnostic question: ${q.question.slice(0, 60)}`); continue; }
    await prisma.diagnosticQuestion.create({
      data: { courseId: course.id, topicId: topic.id, question: q.question, optionA: q.optionA, optionB: q.optionB, optionC: q.optionC, optionD: q.optionD, correctAnswer: q.correctAnswer },
    });
    diagCount++;
  }

  let practiceCount = 0;
  let followUpCount = 0;
  for (const q of data.practice) {
    const topic = topicByName[q.topic];
    if (!topic) { console.warn(`WARNING: no topic "${q.topic}" in ${meta.code} - skipping practice question: ${q.question.slice(0, 60)}`); continue; }
    await prisma.practiceQuestion.create({
      data: { courseId: course.id, topicId: topic.id, question: q.question, options: q.options as unknown as object, correctAnswer: q.correctAnswer, explanation: q.explanation ?? undefined, isFollowUp: q.isFollowUp },
    });
    if (q.isFollowUp) followUpCount++; else practiceCount++;
  }

  let expandedCount = 0;
  for (const q of data.expanded) {
    const topic = topicByName[q.topic];
    if (!topic) { console.warn(`WARNING: no topic "${q.topic}" in ${meta.code} - skipping expanded question: ${q.question.slice(0, 60)}`); continue; }
    await prisma.practiceQuestion.create({
      data: { courseId: course.id, topicId: topic.id, question: q.question, options: q.options as unknown as object, correctAnswer: q.correctAnswer, explanation: q.explanation, isFollowUp: false, difficulty: q.difficulty, questionType: q.questionType },
    });
    expandedCount++;
  }

  let assessCount = 0;
  for (const q of data.assessment) {
    const topic = topicByName[q.topic];
    if (!topic) { console.warn(`WARNING: no topic "${q.topic}" in ${meta.code} - skipping assessment question: ${q.question.slice(0, 60)}`); continue; }
    await prisma.practiceQuestion.create({
      data: {
        courseId: course.id,
        topicId: topic.id,
        question: q.question,
        options: (q.options as unknown as object) ?? [],
        correctAnswer: q.correctAnswer ?? '',
        explanation: q.explanation ?? undefined,
        isFollowUp: false,
        difficulty: q.difficulty,
        questionType: q.questionType,
        subtopic: q.subtopic,
        expectedConcepts: (q.expectedConcepts as unknown as object) ?? undefined,
        maxScore: q.maxScore ?? 1,
      },
    });
    assessCount++;
  }

  let materialCount = 0;
  for (const [topicName, mats] of Object.entries(data.materials)) {
    const topic = topicByName[topicName];
    if (!topic) { console.warn(`WARNING: no topic "${topicName}" in ${meta.code} - skipping ${mats.length} material(s)`); continue; }
    for (let i = 0; i < mats.length; i++) {
      const m = mats[i];
      await prisma.learningMaterial.create({
        data: { courseId: course.id, topicId: topic.id, title: m.title, description: m.description, type: m.type, url: m.url, provider: m.provider, difficulty: m.difficulty, durationMinutes: m.durationMinutes ?? null, sortOrder: i },
      });
      materialCount++;
    }
  }

  console.log(`  ${meta.code}: ${diagCount} diagnostic, ${practiceCount} practice, ${followUpCount} follow-up, ${expandedCount} expanded, ${assessCount} assessment, ${materialCount} materials.`);
  return { courseId: course.id };
}
