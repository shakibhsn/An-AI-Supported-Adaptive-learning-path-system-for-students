/**
 * Database seed script.
 *
 * Run with: npx prisma db seed
 * (wired via the "prisma.seed" key in package.json)
 *
 * Populates every course found under src/data/courses/ (Phase 8: this is
 * a plain directory scan via courseDataLoader.ts - no hardcoded course
 * list, no CourseCode union, no per-course import statement. Adding a
 * course means adding a folder there; this script picks it up with zero
 * changes) plus one demo account.
 *
 * Safe to re-run: wipes and recreates all seeded course/attempt data
 * first. This is a DEV-ONLY, fresh-database script - see
 * prisma/seedCourses.ts for the additive, production-safe equivalent
 * that never wipes anything.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { loadAllCourses } from '../src/data/courseDataLoader';
import { seedCourseContent } from '../src/services/courseSeeder.service';

const prisma = new PrismaClient();

async function main() {
  console.log('Wiping existing seeded data...');
  await prisma.assessmentAttempt.deleteMany();
  await prisma.aIInteraction.deleteMany();
  await prisma.followUpAttempt.deleteMany();
  await prisma.practiceAttempt.deleteMany();
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

  const courses = loadAllCourses();
  console.log(`\nDiscovered ${courses.length} course folder(s): ${courses.map((c) => c.meta.code).join(', ')}`);
  for (const courseData of courses) {
    await seedCourseContent(prisma, courseData);
  }

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
