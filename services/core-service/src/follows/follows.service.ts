// import {
//   BadRequestException,
//   Injectable,
//   NotFoundException,
// } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';

// @Injectable()
// export class FollowsService {
//   constructor(private readonly prisma: PrismaService) {}

//   async followUser(userId: string, targetId: string) {
//     if (userId === targetId)
//       throw new BadRequestException('You cannot follow yourself');

//     const target = await this.prisma.user.findUnique({
//       where: { id: targetId },
//     });
//     if (!target) throw new NotFoundException('User not found');

//     const existing = await this.prisma.follow.findUnique({
//       where: {
//         followerId_followingId: { followerId: userId, followingId: targetId },
//       },
//     });

//     if (existing) throw new BadRequestException('Already following');

//     await this.prisma.follow.create({
//       data: { followerId: userId, followingId: targetId },
//     });

//     return { success: true, message: `You are now following ${target.handle}` };
//   }

//   async unfollowUser(userId: string, targetId: string) {
//     const existing = await this.prisma.follow.findUnique({
//       where: {
//         followerId_followingId: { followerId: userId, followingId: targetId },
//       },
//     });

//     if (!existing)
//       throw new BadRequestException('You are not following this user');

//     await this.prisma.follow.delete({ where: { id: existing.id } });
//     return { success: true, message: 'Unfollowed successfully' };
//   }

//   async getFollowers(userId: string) {
//     return this.prisma.follow.findMany({
//       where: { followingId: userId },
//       include: {
//         follower: { select: { id: true, handle: true, name: true } },
//       },
//     });
//   }
//   async getFollowing(userId: string) {
//     return this.prisma.follow.findMany({
//       where: { followerId: userId },
//       include: {
//         following: { select: { id: true, handle: true, name: true } },
//       },
//     });
//   }
//   async getFollowCounts(userId: string) {
//   const [followers, following] = await Promise.all([
//     this.prisma.follows.count({ where: { followingId: userId } }),
//     this.prisma.follows.count({ where: { followerId: userId } }),
//   ]);

//   return { followers, following };
// }
// async isMutualFollow(userA: string, userB: string) {
//   const [aFollowsB, bFollowsA] = await Promise.all([
//     this.isFollowing(userA, userB),
//     this.isFollowing(userB, userA),
//   ]);
//   return aFollowsB && bFollowsA;
// }
// }
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FollowsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------- FOLLOW / UNFOLLOW ----------------
  async followUser(userId: string, targetId: string) {
    if (userId === targetId)
      throw new BadRequestException('You cannot follow yourself');

    const target = await this.prisma.user.findUnique({
      where: { id: targetId },
    });
    if (!target) throw new NotFoundException('User not found');

    const existing = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId: userId, followingId: targetId },
      },
    });

    if (existing) throw new BadRequestException('Already following');

    await this.prisma.follow.create({
      data: { followerId: userId, followingId: targetId },
    });

    return { success: true, message: `You are now following ${target.handle}` };
  }

  async unfollowUser(userId: string, targetId: string) {
    const existing = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId: userId, followingId: targetId },
      },
    });

    if (!existing)
      throw new BadRequestException('You are not following this user');

    await this.prisma.follow.delete({ where: { id: existing.id } });
    return { success: true, message: 'Unfollowed successfully' };
  }

  // ---------------- FOLLOWER / FOLLOWING LISTS ----------------
  async getFollowers(userId: string) {
    return this.prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: { select: { id: true, handle: true, name: true } },
      },
    });
  }

  async getFollowing(userId: string) {
    return this.prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: { select: { id: true, handle: true, name: true } },
      },
    });
  }

  // ---------------- COUNTS + MUTUAL RELATION ----------------
  async getFollowCounts(userId: string) {
    const [followers, following] = await Promise.all([
      this.prisma.follow.count({ where: { followingId: userId } }),
      this.prisma.follow.count({ where: { followerId: userId } }),
    ]);

    return { followers, following };
  }

  async isFollowing(userId: string, targetId: string) {
    const existing = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId: userId, followingId: targetId },
      },
    });
    return !!existing;
  }

  async isMutualFollow(userA: string, userB: string) {
    const [aFollowsB, bFollowsA] = await Promise.all([
      this.isFollowing(userA, userB),
      this.isFollowing(userB, userA),
    ]);
    return aFollowsB && bFollowsA;
  }
}
