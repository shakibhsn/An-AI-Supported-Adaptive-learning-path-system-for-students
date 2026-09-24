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

// Student Profile - change password. Reuses the exact same
// hashPassword/verifyPassword (bcrypt) used by register/login - no new
// auth mechanism. The current password hash is never sent to the frontend;
// this endpoint only ever returns a success/error message.
export async function changePassword(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ error: 'New passwords do not match.' });
  }
  // Same rule as registration (auth.controller.register) - kept identical
  // deliberately so there is only one definition of "valid password" in the app.
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password does not meet the required security rules (minimum 8 characters).' });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Current password is incorrect.' });
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return res.json({ message: 'Password changed successfully.' });
}

// Student Profile - edit name only. Email is intentionally NOT editable
// here: it's the unique login identifier the existing auth system keys on
// (see register's uniqueness check), and studentId/id are system-generated -
// changing either would need new verification/uniqueness flows outside this
// task's scope.
export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { name } = req.body;
  if (typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Name is required.' });
  }
  if (name.trim().length > 100) {
    return res.status(400).json({ error: 'Name is too long.' });
  }

  const user = await prisma.user.update({
    where: { id: req.user.userId },
    data: { name: name.trim() },
  });
  return res.json({ id: user.id, name: user.name, studentId: user.studentId, email: user.email });
}
