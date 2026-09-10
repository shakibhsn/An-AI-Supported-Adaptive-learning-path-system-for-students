import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 12;
const JWT_EXPIRES_IN = '7d';

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export interface JwtPayload {
  userId: string;
  email: string;
}

export function signToken(payload: JwtPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set. Add it to your .env file.');
  }
  return jwt.sign(payload, secret, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set. Add it to your .env file.');
  }
  return jwt.verify(token, secret) as JwtPayload;
}

// A university email is required per the spec (Section 6). UIU's domain is
// used as the default validation pattern since the seed data and demo
// account both use @bscse.uiu.ac.bd - change UNIVERSITY_EMAIL_DOMAIN in
// .env if your institution's domain differs.
export function isValidUniversityEmail(email: string): boolean {
  const domain = process.env.UNIVERSITY_EMAIL_DOMAIN || 'uiu.ac.bd';
  const basicShape = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return basicShape.test(email) && email.toLowerCase().endsWith(domain.toLowerCase());
}
