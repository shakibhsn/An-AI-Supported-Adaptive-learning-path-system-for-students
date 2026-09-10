import { Request, Response } from 'express';
import { prisma } from '../prisma';

export async function getCourses(_req: Request, res: Response) {
  const courses = await prisma.course.findMany();
  return res.json(courses);
}

export async function getCourse(req: Request, res: Response) {
  const course = await prisma.course.findUnique({ where: { id: req.params.courseId } });
  if (!course) return res.status(404).json({ error: 'Course not found' });
  return res.json(course);
}

export async function getCourseTopics(req: Request, res: Response) {
  const topics = await prisma.topic.findMany({ where: { courseId: req.params.courseId } });
  return res.json(topics);
}
