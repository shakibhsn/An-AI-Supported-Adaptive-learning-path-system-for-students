/**
 * Phase 8: generic, manifest-driven course content loader.
 *
 * Replaces the closed `CourseCode = 'DSA' | 'OOP' | ...` union pattern
 * (topicMapping.ts / seedQuestions.ts / expandedQuestions.ts /
 * assessmentQuestions.ts / learningMaterials.ts) with a plain folder scan:
 * every subdirectory of `src/data/courses/` is a course, discovered at
 * RUNTIME via fs.readdirSync - never a hardcoded list, never a new
 * `import` statement. Adding a course is "add a folder", not "edit six
 * TypeScript files".
 *
 * Folder layout (backend/src/data/courses/<folder>/):
 *   course.json      REQUIRED  - { code, name, description, topics: [{name, prerequisite}] }
 *   diagnostic.json  optional  - DiagnosticSeed[]
 *   practice.json    optional  - PracticeSeed[]  (isFollowUp flag distinguishes practice vs follow-up)
 *   expanded.json    optional  - ExpandedSeed[]  (EASY/HARD tiered rolling practice)
 *   assessment.json  optional  - AssessmentSeed[] (the 30/topic Easy/Medium/Hard bank)
 *   materials.json   optional  - Record<topicName, MaterialSeed[]>
 *
 * Every optional file defaults to an empty array/object if absent - a
 * brand-new course can exist with just topics and no content yet, exactly
 * like assessmentQuestions.ts's existing `Partial<Record<...>>` already
 * allowed for OOP/SPL before their assessment banks were authored.
 */

import fs from 'fs';
import path from 'path';

export interface CourseTopicDef {
  name: string;
  prerequisite: string | null;
}

export interface CourseMeta {
  code: string;
  name: string;
  description: string;
  topics: CourseTopicDef[];
}

export interface DiagnosticSeed {
  topic: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
}

export interface PracticeSeed {
  topic: string;
  question: string;
  options: { letter: string; text: string }[];
  correctAnswer: string;
  explanation?: string | null;
  isFollowUp: boolean;
}

export interface ExpandedSeed {
  topic: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  questionType: string;
  question: string;
  options: { letter: string; text: string }[];
  correctAnswer: string;
  explanation: string;
}

export interface AssessmentSeed {
  topic: string;
  subtopic: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  questionType: 'MCQ' | 'SHORT_ANSWER' | 'PROBLEM_SOLVING';
  question: string;
  options?: { letter: string; text: string }[];
  correctAnswer?: string;
  explanation?: string;
  expectedConcepts?: string[];
  maxScore?: number;
}

export interface MaterialSeed {
  title: string;
  description?: string | null;
  type: string;
  url: string;
  provider?: string | null;
  difficulty: string;
  durationMinutes?: number | null;
}

export interface LoadedCourseData {
  folder: string;
  meta: CourseMeta;
  diagnostic: DiagnosticSeed[];
  practice: PracticeSeed[];
  expanded: ExpandedSeed[];
  assessment: AssessmentSeed[];
  materials: Record<string, MaterialSeed[]>;
}

const COURSES_DIR = path.join(__dirname, 'courses');

function readJsonIfExists<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch (err) {
    throw new Error(`Invalid JSON in ${filePath}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/** Every immediate subdirectory of courses/ - the folder name itself is never interpreted, just enumerated. */
export function discoverCourseFolders(): string[] {
  if (!fs.existsSync(COURSES_DIR)) return [];
  return fs.readdirSync(COURSES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export function loadCourseData(folder: string): LoadedCourseData {
  const dir = path.join(COURSES_DIR, folder);
  const meta = readJsonIfExists<CourseMeta | null>(path.join(dir, 'course.json'), null);
  if (!meta) {
    throw new Error(`Course folder "${folder}" is missing a required course.json.`);
  }
  if (!meta.code || !meta.name || !Array.isArray(meta.topics) || meta.topics.length === 0) {
    throw new Error(`Course folder "${folder}"'s course.json must have a code, name, and at least one topic.`);
  }

  return {
    folder,
    meta,
    diagnostic: readJsonIfExists(path.join(dir, 'diagnostic.json'), []),
    practice: readJsonIfExists(path.join(dir, 'practice.json'), []),
    expanded: readJsonIfExists(path.join(dir, 'expanded.json'), []),
    assessment: readJsonIfExists(path.join(dir, 'assessment.json'), []),
    materials: readJsonIfExists(path.join(dir, 'materials.json'), {}),
  };
}

/** Every course the data folder currently defines, fully loaded and validated. */
export function loadAllCourses(): LoadedCourseData[] {
  return discoverCourseFolders().map(loadCourseData);
}
