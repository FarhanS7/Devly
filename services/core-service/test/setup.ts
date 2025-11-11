import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

export const prisma = new PrismaClient();

/**
 * Clear all tables safely.
 * Order matters because of foreign keys.
 */
export async function clearDb() {
  await prisma.like.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.follow.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.user.deleteMany({});
}

beforeAll(async () => {
  console.log('🧪 Setting up test database...');
  await prisma.$connect();
  await clearDb();
});

afterAll(async () => {
  console.log('🧹 Cleaning up test database...');
  await clearDb();
  await prisma.$disconnect();
});
