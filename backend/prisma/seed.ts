/**
 * Database seed script.
 *
 * Run with: npx prisma db seed
 * (wired via the "prisma.seed" key in package.json)
 *
 * Populates:
 *   - 3 courses (DSA, OOP, SPL)
 *   - Canonical topics per course + prerequisite links
 *   - 30 real diagnostic questions (10/course) - extracted verbatim from
 *     the original frontend prototype, topic-mapped (see src/data/topicMapping.ts)
 *   - 45 real practice/follow-up questions (10 practice + 5 follow-up per course)
 *   - One demo account (see printed credentials at the end - these are
 *     NOT committed anywhere in frontend source, per Section 22)
 *
 * Safe to re-run: wipes and recreates all seeded tables first.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { CANONICAL_TOPICS, PREREQUISITES, CourseCode } from '../src/data/topicMapping';
import { SEED_QUESTIONS } from '../src/data/seedQuestions';
import { EXPANDED_QUESTIONS } from '../src/data/expandedQuestions';
import { ASSESSMENT_QUESTIONS } from '../src/data/assessmentQuestions';
import { LEARNING_MATERIALS } from '../src/data/learningMaterials';

const prisma = new PrismaClient();

const COURSES: { code: CourseCode; name: string; description: string }[] = [
  { code: 'DSA', name: 'Data Structures and Algorithms', description: 'Core data structures, algorithmic complexity, and traversal/search techniques.' },
  { code: 'OOP', name: 'Object-Oriented Programming', description: 'Classes, inheritance, polymorphism, and OOP design principles.' },
  { code: 'SPL', name: 'Structured Programming Language', description: 'C fundamentals: pointers, memory management, and structures.' },
];

async function main() {
  console.log('Wiping existing seeded data...');
  await prisma.assessmentAttempt.deleteMany();
  await prisma.aIInteraction.deleteMany();
  await prisma.followUpAttempt.deleteMany();
  await prisma.practiceAttempt.deleteMany();
  // These two were missing from the wipe list even though the docstring
  // above claims "wipes and recreates all seeded tables first" - harmless
  // while the DB had little Playwright-test activity data, but a real
  // FK-violation bug once PracticeQuestionAttempt/LearningActivity rows
  // accumulate (both reference practiceQuestion/topic/course, deleted
  // below). Fixing here since it silently blocks every future reseed.
  await prisma.practiceQuestionAttempt.deleteMany();
  await prisma.learningActivity.deleteMany();
  await prisma.materialCompletion.deleteMany();
  await prisma.learningMaterial.deleteMany();
  await prisma.learningPathItem.deleteMany();
  await prisma.learningPath.deleteMany();
  await prisma.topicMastery.deleteMany();
  await prisma.diagnosticAnswer.deleteMany();
  await prisma.diagnosticAttempt.deleteMany();
  await prisma.practiceQuestion.deleteMany();
  await prisma.diagnosticQuestion.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.course.deleteMany();

  const courseByCode: Record<CourseCode, { id: string }> = {} as never;

  for (const c of COURSES) {
    const course = await prisma.course.create({ data: c });
    courseByCode[c.code] = course;
    console.log(`Created course ${c.code} (${course.id})`);
  }

  // Topics: create all topics first WITHOUT prerequisite links (since a
  // prerequisite must already exist to be referenced), then a second pass
  // to set prerequisiteTopicId now that every topic has an id.
  const topicByName: Record<string, { id: string }> = {};

  for (const c of COURSES) {
    for (const topicName of CANONICAL_TOPICS[c.code]) {
      const topic = await prisma.topic.create({
        data: { courseId: courseByCode[c.code].id, name: topicName },
      });
      topicByName[`${c.code}:${topicName}`] = topic;
    }
  }

  for (const c of COURSES) {
    for (const [topicName, prereqName] of Object.entries(PREREQUISITES[c.code])) {
      if (!prereqName) continue;
      await prisma.topic.update({
        where: { id: topicByName[`${c.code}:${topicName}`].id },
        data: { prerequisiteTopicId: topicByName[`${c.code}:${prereqName}`].id },
      });
    }
  }
  console.log('Created topics + prerequisite links.');

  // Diagnostic questions
  for (const c of COURSES) {
    const questions = SEED_QUESTIONS[c.code].diagnostic;
    for (const q of questions) {
      const topic = topicByName[`${c.code}:${q.topic}`];
      if (!topic) {
        console.warn(`WARNING: no topic found for "${q.topic}" in ${c.code} - skipping question: ${q.question.slice(0, 60)}`);
        continue;
      }
      await prisma.diagnosticQuestion.create({
        data: {
          courseId: courseByCode[c.code].id,
          topicId: topic.id,
          question: q.question,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctAnswer: q.correctAnswer,
        },
      });
    }
    console.log(`Seeded ${questions.length} diagnostic questions for ${c.code}.`);
  }

  // Practice + follow-up questions (same table, isFollowUp flag distinguishes them)
  for (const c of COURSES) {
    const questions = SEED_QUESTIONS[c.code].practice;
    for (const q of questions) {
      const topic = topicByName[`${c.code}:${q.topic}`];
      if (!topic) {
        console.warn(`WARNING: no topic found for "${q.topic}" in ${c.code} - skipping question: ${q.question.slice(0, 60)}`);
        continue;
      }
      await prisma.practiceQuestion.create({
        data: {
          courseId: courseByCode[c.code].id,
          topicId: topic.id,
          question: q.question,
          options: q.options as unknown as object,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation ?? undefined,
          isFollowUp: q.isFollowUp,
        },
      });
    }
    const practiceCount = questions.filter((q) => !q.isFollowUp).length;
    const followUpCount = questions.filter((q) => q.isFollowUp).length;
    console.log(`Seeded ${practiceCount} practice + ${followUpCount} follow-up questions for ${c.code}.`);
  }

  // Expanded difficulty-tiered practice questions (EASY/HARD; see
  // src/data/expandedQuestions.ts for provenance). Feeds adaptive selection.
  for (const c of COURSES) {
    const expanded = EXPANDED_QUESTIONS[c.code];
    let seeded = 0;
    for (const q of expanded) {
      const topic = topicByName[`${c.code}:${q.topic}`];
      if (!topic) {
        console.warn(`WARNING: no topic found for "${q.topic}" in ${c.code} - skipping expanded question: ${q.question.slice(0, 60)}`);
        continue;
      }
      await prisma.practiceQuestion.create({
        data: {
          courseId: courseByCode[c.code].id,
          topicId: topic.id,
          question: q.question,
          options: q.options as unknown as object,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          isFollowUp: false,
          difficulty: q.difficulty,
          questionType: q.questionType,
        },
      });
      seeded++;
    }
    console.log(`Seeded ${seeded} expanded (EASY/HARD) practice questions for ${c.code}.`);
  }

  // Randomized Adaptive Assessment question bank (see src/data/assessmentQuestions.ts).
  // Stored in the same PracticeQuestion table (reuses the existing schema/
  // indexes) - rows here are distinguished by having a non-null `subtopic`,
  // which ordinary practice/expanded questions never set.
  for (const c of COURSES) {
    const assessmentQs = ASSESSMENT_QUESTIONS[c.code];
    if (!assessmentQs) continue;
    let seeded = 0;
    for (const q of assessmentQs) {
      const topic = topicByName[`${c.code}:${q.topic}`];
      if (!topic) {
        console.warn(`WARNING: no topic found for "${q.topic}" in ${c.code} - skipping assessment question: ${q.question.slice(0, 60)}`);
        continue;
      }
      await prisma.practiceQuestion.create({
        data: {
          courseId: courseByCode[c.code].id,
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
      seeded++;
    }
    console.log(`Seeded ${seeded} randomized-assessment questions for ${c.code}.`);
  }

  // Curated learning materials (Section 15-18). Extensible: edit
  // src/data/learningMaterials.ts and re-seed, or INSERT rows directly.
  let materialCount = 0;
  for (const c of COURSES) {
    const byTopic = LEARNING_MATERIALS[c.code] || {};
    for (const [topicName, materials] of Object.entries(byTopic)) {
      const topic = topicByName[`${c.code}:${topicName}`];
      if (!topic) {
        console.warn(`WARNING: no topic "${topicName}" in ${c.code} - skipping ${materials.length} material(s)`);
        continue;
      }
      for (let i = 0; i < materials.length; i++) {
        const m = materials[i];
        await prisma.learningMaterial.create({
          data: {
            courseId: courseByCode[c.code].id,
            topicId: topic.id,
            title: m.title,
            description: m.description,
            type: m.type,
            url: m.url,
            provider: m.provider,
            difficulty: m.difficulty,
            durationMinutes: m.durationMinutes ?? null,
            sortOrder: i,
          },
        });
        materialCount++;
      }
    }
  }
  console.log(`Seeded ${materialCount} learning materials.`);

  // Demo account - password is printed once here, never hardcoded in
  // frontend source (Section 22). Change it immediately in a real deployment.
  const demoPassword = 'AdaptivePath#Demo2026';
  const demoPasswordHash = await bcrypt.hash(demoPassword, 12);
  // upsert (not create) so the seed stays re-runnable - real signups in the
  // User table are never wiped, so the demo row may already exist.
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo.student@bscse.uiu.ac.bd' },
    update: { name: 'Demo Student', studentId: '223210', passwordHash: demoPasswordHash },
    create: {
      name: 'Demo Student',
      studentId: '223210',
      email: 'demo.student@bscse.uiu.ac.bd',
      passwordHash: demoPasswordHash,
    },
  });

  console.log('\n=== SEED COMPLETE ===');
  console.log(`Demo account created:`);
  console.log(`  Email:    ${demoUser.email}`);
  console.log(`  Password: ${demoPassword}`);
  console.log('  (Also written to backend/DEMO_ACCOUNT.md - do not commit that file if it contains a real production password.)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
