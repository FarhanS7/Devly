import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

const prisma = new PrismaClient();

beforeAll(async () => {
  console.log('🧪 Setting up test database...');
  await prisma.$connect();
});

afterAll(async () => {
  console.log('🧹 Cleaning up test database...');
  await prisma.$disconnect();
});
export async function clearDb() {
  await prisma.refreshToken.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.like.deleteMany();
  await prisma.post.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();
}
