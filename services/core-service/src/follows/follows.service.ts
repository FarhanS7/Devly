// import {
//   BadRequestException,
//   Injectable,
//   NotFoundException,
// } from '@nestjs/common';
// import { NotificationProducer } from '../common/queues/notification.producer';
// import { PrismaService } from '../prisma/prisma.service';

// @Injectable()
// export class FollowsService {
//   constructor(
//     private readonly prisma: PrismaService,
//     private readonly notifications: NotificationProducer,
//   ) {}

//   // ---------------- FOLLOW USER ----------------
//   async followUser(userId: string, targetId: string) {
//     if (userId === targetId) {
//       throw new BadRequestException('You cannot follow yourself');
//     }

//     // Ensure target user exists
//     const target = await this.prisma.user.findUnique({
//       where: { id: targetId },
//     });
//     if (!target) throw new NotFoundException('User not found');

//     // Check if already following
//     const existing = await this.prisma.follow.findUnique({
//       where: {
//         followerId_followingId: { followerId: userId, followingId: targetId },
//       },
//     });

//     if (existing) throw new BadRequestException('Already following');

//     // Create follow record
//     await this.prisma.follow.create({
//       data: { followerId: userId, followingId: targetId },
//     });

//     // Fetch follower handle for the notification
//     const follower = await this.prisma.user.findUnique({
//       where: { id: userId },
//       select: { handle: true },
//     });

//     //  Queue follow notification in Redis
//     await this.notifications.sendFollowNotification(
//       userId,
//       targetId,
//       follower?.handle || 'Someone',
//     );

//     return {
//       success: true,
//       message: `You are now following ${target.handle}`,
//     };
//   }

//   // ---------------- UNFOLLOW USER ----------------
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

//   // ---------------- FOLLOWER / FOLLOWING LISTS ----------------
//   async getFollowers(userId: string) {
//     const followers = await this.prisma.follow.findMany({
//       where: { followingId: userId },
//       include: {
//         follower: {
//           select: { id: true, handle: true, name: true, avatarUrl: true },
//         },
//       },
//     });

//     return followers.map((f) => f.follower);
//   }

//   async getFollowing(userId: string) {
//     const following = await this.prisma.follow.findMany({
//       where: { followerId: userId },
//       include: {
//         following: {
//           select: { id: true, handle: true, name: true, avatarUrl: true },
//         },
//       },
//     });

//     return following.map((f) => f.following);
//   }

//   // ---------------- COUNTS & RELATION HELPERS ----------------
//   async getFollowCounts(userId: string) {
//     const [followers, following] = await Promise.all([
//       this.prisma.follow.count({ where: { followingId: userId } }),
//       this.prisma.follow.count({ where: { followerId: userId } }),
//     ]);
//     return { followers, following };
//   }

//   async isFollowing(userId: string, targetId: string) {
//     const existing = await this.prisma.follow.findUnique({
//       where: {
//         followerId_followingId: { followerId: userId, followingId: targetId },
//       },
//     });
//     return !!existing;
//   }

//   async isMutualFollow(userA: string, userB: string) {
//     const [aFollowsB, bFollowsA] = await Promise.all([
//       this.isFollowing(userA, userB),
//       this.isFollowing(userB, userA),
//     ]);
//     return aFollowsB && bFollowsA;
//   }
// }
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationProducer } from '../common/queues/notification.producer';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FollowsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationProducer,
  ) {}

  // ---------------- FOLLOW USER ----------------
  async followUser(userId: string, targetId: string) {
    if (userId === targetId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    // Ensure target user exists
    const target = await this.prisma.user.findUnique({
      where: { id: targetId },
    });
    if (!target) throw new NotFoundException('User not found');

    // Check if already following
    const existing = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId: userId, followingId: targetId },
      },
    });

    if (existing) throw new BadRequestException('Already following');

    // Create follow record
    await this.prisma.follow.create({
      data: { followerId: userId, followingId: targetId },
    });

    // Fetch follower handle for the notification
    const follower = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { handle: true },
    });

    // Queue follow notification in Redis (best effort)
    try {
      await this.notifications.sendFollowNotification(
        userId,
        targetId,
        follower?.handle || 'Someone',
      );
    } catch {
      // ignore queue errors in dev/test
    }

    return {
      success: true,
      message: `You are now following ${target.handle}`,
    };
  }

  // ---------------- UNFOLLOW USER ----------------
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
        follower: {
          select: {
            id: true,
            handle: true,
            name: true,
            avatarUrl: true,
            bio: true,
          },
        },
      },
    });
  }

  async getFollowing(userId: string) {
    return this.prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            handle: true,
            name: true,
            avatarUrl: true,
            bio: true,
          },
        },
      },
    });
  }

  // ---------------- COUNTS & RELATION HELPERS ----------------
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
