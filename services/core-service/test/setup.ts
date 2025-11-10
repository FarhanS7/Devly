// test/setup.ts
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment for test DB
dotenv.config({ path: '.env.test' });

export const prisma = new PrismaClient();

/**
 * Safely clears all tables in dependency order.
 * Adjust if you add new models later.
 */
export async function clearDb() {
  await prisma.like.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.follow.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.user.deleteMany({});
}

/**
 * Global test lifecycle hooks
 * - Do NOT clear on afterEach; some E2E suites expect state persistence.
 */
beforeAll(async () => {
  console.log(' Setting up test database...');
  await prisma.$connect();
  await clearDb(); // clean once before all tests
});

afterAll(async () => {
  console.log(' Cleaning up test database...');
  await clearDb();
  await prisma.$disconnect();
});
