-- AlterTable
ALTER TABLE "DiagnosticQuestion" ADD COLUMN     "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM';

-- AlterTable
ALTER TABLE "PracticeQuestion" ADD COLUMN     "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "questionType" TEXT NOT NULL DEFAULT 'MCQ';

-- CreateTable
CREATE TABLE "PracticeQuestionAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeQuestionAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "topicId" TEXT,
    "materialId" TEXT,
    "activityType" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'in_app',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PracticeQuestionAttempt_userId_topicId_difficulty_idx" ON "PracticeQuestionAttempt"("userId", "topicId", "difficulty");

-- CreateIndex
CREATE INDEX "PracticeQuestionAttempt_questionId_idx" ON "PracticeQuestionAttempt"("questionId");

-- CreateIndex
CREATE INDEX "LearningActivity_userId_courseId_createdAt_idx" ON "LearningActivity"("userId", "courseId", "createdAt");

-- CreateIndex
CREATE INDEX "LearningActivity_userId_topicId_idx" ON "LearningActivity"("userId", "topicId");

-- CreateIndex
CREATE INDEX "PracticeQuestion_topicId_isFollowUp_difficulty_idx" ON "PracticeQuestion"("topicId", "isFollowUp", "difficulty");

-- AddForeignKey
ALTER TABLE "PracticeQuestionAttempt" ADD CONSTRAINT "PracticeQuestionAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeQuestionAttempt" ADD CONSTRAINT "PracticeQuestionAttempt_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "PracticeQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeQuestionAttempt" ADD CONSTRAINT "PracticeQuestionAttempt_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningActivity" ADD CONSTRAINT "LearningActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningActivity" ADD CONSTRAINT "LearningActivity_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningActivity" ADD CONSTRAINT "LearningActivity_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningActivity" ADD CONSTRAINT "LearningActivity_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "LearningMaterial"("id") ON DELETE SET NULL ON UPDATE CASCADE;
