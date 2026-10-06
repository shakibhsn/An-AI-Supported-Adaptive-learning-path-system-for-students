/**
 * Phase 3 course-addition script: OS, CA, DBMS.
 *
 * Run with: npx tsx prisma/seedPhase3.ts
 *
 * UNLIKE seed.ts, this script is purely ADDITIVE and never deletes
 * anything - no wipe step, no deleteMany() calls anywhere. seed.ts wipes
 * and recreates all course-related data on every run (documented, safe
 * ONLY for a fresh dev database); running it again now would delete every
 * student's real learning progress (TopicMastery, LearningPath,
 * AssessmentAttempt, etc. all cascade-delete when Course/Topic are wiped).
 * That is explicitly forbidden by this project's rules ("do not reset the
 * database", "do not delete existing user data or learning progress"), so
 * Phase 3 gets its own non-destructive script instead.
 *
 * Idempotent at the course level: if a course's `code` already exists, its
 * entire block (topics/questions/materials) is skipped - safe to re-run
 * after a partial failure without creating duplicates, and safe to run
 * repeatedly in general.
 */

import { PrismaClient } from '@prisma/client';
import { CANONICAL_TOPICS, PREREQUISITES, CourseCode } from '../src/data/topicMapping';
import { SEED_QUESTIONS } from '../src/data/seedQuestions';
import { EXPANDED_QUESTIONS } from '../src/data/expandedQuestions';
import { ASSESSMENT_QUESTIONS } from '../src/data/assessmentQuestions';
import { LEARNING_MATERIALS } from '../src/data/learningMaterials';

const prisma = new PrismaClient();

const NEW_COURSES: { code: CourseCode; name: string; description: string }[] = [
  { code: 'OS', name: 'Operating Systems', description: 'Processes, threads, scheduling, synchronization, memory management, and file systems.' },
  { code: 'CA', name: 'Computer Architecture', description: 'Number systems, digital logic, CPU organization, memory hierarchy, and pipelining.' },
  { code: 'DBMS', name: 'Database Management Systems', description: 'Relational modeling, SQL, normalization, transactions, and concurrency control.' },
];

async function seedCourse(c: { code: CourseCode; name: string; description: string }) {
  const existing = await prisma.course.findUnique({ where: { code: c.code } });
  if (existing) {
    console.log(`SKIP: course ${c.code} already exists (${existing.id}) - no changes made.`);
    return;
  }

  console.log(`\n=== Seeding ${c.code} (${c.name}) ===`);
  const course = await prisma.course.create({ data: c });
  console.log(`Created course ${c.code} (${course.id})`);

  // Topics: create all first (without prerequisite links), then a second
  // pass to set prerequisiteTopicId now that every topic in this course has an id.
  const topicByName: Record<string, { id: string }> = {};
  for (const topicName of CANONICAL_TOPICS[c.code]) {
    const topic = await prisma.topic.create({ data: { courseId: course.id, name: topicName } });
    topicByName[topicName] = topic;
  }
  for (const [topicName, prereqName] of Object.entries(PREREQUISITES[c.code])) {
    if (!prereqName) continue;
    await prisma.topic.update({
      where: { id: topicByName[topicName].id },
      data: { prerequisiteTopicId: topicByName[prereqName].id },
    });
  }
  console.log(`Created ${Object.keys(topicByName).length} topics + prerequisite links.`);

  // Diagnostic questions
  const seedData = SEED_QUESTIONS[c.code];
  let diagCount = 0;
  for (const q of seedData.diagnostic) {
    const topic = topicByName[q.topic];
    if (!topic) {
      console.warn(`WARNING: no topic "${q.topic}" in ${c.code} - skipping diagnostic question: ${q.question.slice(0, 60)}`);
      continue;
    }
    await prisma.diagnosticQuestion.create({
      data: {
        courseId: course.id,
        topicId: topic.id,
        question: q.question,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctAnswer: q.correctAnswer,
      },
    });
    diagCount++;
  }
  console.log(`Seeded ${diagCount} diagnostic questions.`);

  // Practice + follow-up questions (same table, isFollowUp flag distinguishes them)
  let practiceCount = 0;
  let followUpCount = 0;
  for (const q of seedData.practice) {
    const topic = topicByName[q.topic];
    if (!topic) {
      console.warn(`WARNING: no topic "${q.topic}" in ${c.code} - skipping practice question: ${q.question.slice(0, 60)}`);
      continue;
    }
    await prisma.practiceQuestion.create({
      data: {
        courseId: course.id,
        topicId: topic.id,
        question: q.question,
        options: q.options as unknown as object,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation ?? undefined,
        isFollowUp: q.isFollowUp,
      },
    });
    if (q.isFollowUp) followUpCount++; else practiceCount++;
  }
  console.log(`Seeded ${practiceCount} practice + ${followUpCount} follow-up questions.`);

  // Expanded difficulty-tiered practice questions (EASY/HARD)
  let expandedCount = 0;
  for (const q of EXPANDED_QUESTIONS[c.code]) {
    const topic = topicByName[q.topic];
    if (!topic) {
      console.warn(`WARNING: no topic "${q.topic}" in ${c.code} - skipping expanded question: ${q.question.slice(0, 60)}`);
      continue;
    }
    await prisma.practiceQuestion.create({
      data: {
        courseId: course.id,
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
    expandedCount++;
  }
  console.log(`Seeded ${expandedCount} expanded (EASY/HARD) practice questions.`);

  // Randomized Adaptive Assessment question bank (30/topic: EASY/MEDIUM/HARD)
  const assessmentQs = ASSESSMENT_QUESTIONS[c.code] ?? [];
  let assessCount = 0;
  for (const q of assessmentQs) {
    const topic = topicByName[q.topic];
    if (!topic) {
      console.warn(`WARNING: no topic "${q.topic}" in ${c.code} - skipping assessment question: ${q.question.slice(0, 60)}`);
      continue;
    }
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
  console.log(`Seeded ${assessCount} randomized-assessment questions.`);

  // Curated learning materials
  const byTopic = LEARNING_MATERIALS[c.code] || {};
  let materialCount = 0;
  for (const [topicName, materials] of Object.entries(byTopic)) {
    const topic = topicByName[topicName];
    if (!topic) {
      console.warn(`WARNING: no topic "${topicName}" in ${c.code} - skipping ${materials.length} material(s)`);
      continue;
    }
    for (let i = 0; i < materials.length; i++) {
      const m = materials[i];
      await prisma.learningMaterial.create({
        data: {
          courseId: course.id,
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
  console.log(`Seeded ${materialCount} learning materials.`);
}

async function main() {
  for (const c of NEW_COURSES) {
    await seedCourse(c);
  }
  console.log('\n=== PHASE 3 SEED COMPLETE (additive only - no existing data touched) ===');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
