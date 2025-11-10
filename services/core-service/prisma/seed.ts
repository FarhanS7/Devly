/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.time('seed');

  // --- Clean (dev only) ---
  await prisma.comment.deleteMany();
  await prisma.like.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.post.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  // --- Users ---
  const pass = await argon2.hash('Passw0rd!');
  const [alice, bob, carol, dave, eve] = await Promise.all([
    prisma.user.create({
      data: {
        email: 'alice@example.com',
        handle: 'alice',
        passwordHash: pass,
        name: 'Alice',
      },
    }),
    prisma.user.create({
      data: {
        email: 'bob@example.com',
        handle: 'bob',
        passwordHash: pass,
        name: 'Bob',
      },
    }),
    prisma.user.create({
      data: {
        email: 'carol@example.com',
        handle: 'carol',
        passwordHash: pass,
        name: 'Carol',
      },
    }),
    prisma.user.create({
      data: {
        email: 'dave@example.com',
        handle: 'dave',
        passwordHash: pass,
        name: 'Dave',
      },
    }),
    prisma.user.create({
      data: {
        email: 'eve@example.com',
        handle: 'eve',
        passwordHash: pass,
        name: 'Eve',
      },
    }),
  ]);

  // --- Follows ---
  await prisma.follow.createMany({
    data: [
      { followerId: alice.id, followingId: bob.id },
      { followerId: alice.id, followingId: carol.id },
      { followerId: bob.id, followingId: alice.id },
      { followerId: carol.id, followingId: alice.id },
      { followerId: dave.id, followingId: alice.id },
    ],
    skipDuplicates: true,
  });

  // --- Posts ---
  const p1 = await prisma.post.create({
    data: {
      authorId: alice.id,
      content: 'Hello DevConnect! 🚀',
      codeSnippet: 'console.log("hello");',
    },
  });
  const p2 = await prisma.post.create({
    data: { authorId: bob.id, content: 'Typescript tips: utility types FTW.' },
  });
  const p3 = await prisma.post.create({
    data: { authorId: carol.id, content: 'NestJS + Prisma = ❤️' },
  });
  const p4 = await prisma.post.create({
    data: { authorId: alice.id, content: 'Another day, another commit.' },
  });

  // --- Likes ---
  await prisma.like.createMany({
    data: [
      { userId: bob.id, postId: p1.id },
      { userId: carol.id, postId: p1.id },
      { userId: dave.id, postId: p1.id },
      { userId: alice.id, postId: p2.id },
      { userId: eve.id, postId: p3.id },
    ],
    skipDuplicates: true,
  });

  // --- Comments ---
  await prisma.comment.createMany({
    data: [
      { userId: bob.id, postId: p1.id, text: 'Nice!' },
      { userId: carol.id, postId: p1.id, text: 'Welcome 🎉' },
      { userId: alice.id, postId: p2.id, text: 'Agree!' },
      { userId: eve.id, postId: p3.id, text: 'So true.' },
    ],
  });

  console.timeEnd('seed');
  console.log('Seeded users:', { alice, bob, carol, dave, eve });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
