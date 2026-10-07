/**
 * Phase 8: generic, additive course-addition script.
 *
 * Run with: npx tsx prisma/seedCourses.ts
 *
 * Replaces prisma/seedPhase3.ts. UNLIKE seed.ts, this is purely ADDITIVE -
 * no wipe step, no deleteMany() calls anywhere - so it is safe to run
 * against a real database with real student progress. For every course
 * folder discovered under src/data/courses/ (courseDataLoader.ts), if a
 * course with that code doesn't exist yet, it's added in full (topics,
 * prerequisites, diagnostic/practice/expanded/assessment questions,
 * materials); if it already exists, it's skipped entirely - idempotent,
 * safe to re-run any time.
 *
 * Adding a new course going forward is: 1) add a folder under
 * src/data/courses/, 2) run this script. No TypeScript file needs to
 * change, and there is no "seedPhase4.ts" to write - this script already
 * handles however many new course folders show up.
 */

import { PrismaClient } from '@prisma/client';
import { loadAllCourses } from '../src/data/courseDataLoader';
import { seedCourseContent } from '../src/services/courseSeeder.service';

const prisma = new PrismaClient();

async function main() {
  const courses = loadAllCourses();
  console.log(`Discovered ${courses.length} course folder(s): ${courses.map((c) => c.meta.code).join(', ')}\n`);

  for (const courseData of courses) {
    const existing = await prisma.course.findUnique({ where: { code: courseData.meta.code } });
    if (existing) {
      console.log(`SKIP: course ${courseData.meta.code} already exists (${existing.id}) - no changes made.`);
      continue;
    }
    console.log(`=== Seeding ${courseData.meta.code} (${courseData.meta.name}) ===`);
    await seedCourseContent(prisma, courseData);
  }

  console.log('\n=== DONE (additive only - no existing data touched) ===');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
