import { PrismaClient } from '@prisma/client';

// Standard singleton pattern for Prisma in a long-running Node process -
// prevents exhausting the connection pool from hot-reload re-imports.
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma = global.__prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}
