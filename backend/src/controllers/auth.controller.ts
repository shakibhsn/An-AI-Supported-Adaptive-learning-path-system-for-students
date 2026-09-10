import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { hashPassword, verifyPassword, signToken, isValidUniversityEmail } from '../utils/auth.utils';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export async function register(req: Request, res: Response) {
  const { name, studentId, universityEmail, password, confirmPassword } = req.body;

  if (!name || !studentId || !universityEmail || !password || !confirmPassword) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }
  if (!isValidUniversityEmail(universityEmail)) {
    return res.status(400).json({ error: 'Please use a valid university email address.' });
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: universityEmail }, { studentId }] },
  });
  if (existing) {
    return res.status(409).json({ error: 'An account with this email or student ID already exists.' });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, studentId, email: universityEmail, passwordHash },
  });

  const token = signToken({ userId: user.id, email: user.email });
  return res.status(201).json({
    token,
    user: { id: user.id, name: user.name, studentId: user.studentId, email: user.email },
  });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = signToken({ userId: user.id, email: user.email });
  return res.json({
    token,
    user: { id: user.id, name: user.name, studentId: user.studentId, email: user.email },
  });
}

export async function me(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({ id: user.id, name: user.name, studentId: user.studentId, email: user.email });
}

export async function logout(_req: Request, res: Response) {
  // JWTs are stateless - "logout" is a frontend concern (discard the
  // token). This endpoint exists for API-shape completeness per the spec
  // and as a hook point if a token-blocklist is added later.
  return res.json({ message: 'Logged out.' });
}
