// import {
//   Controller,
//   Delete,
//   Get,
//   Param,
//   Post,
//   Req,
//   UseGuards,
// } from '@nestjs/common';
// import { JwtAuthGuard } from '../auth/guards/jwt.guard';
// import { FollowsService } from './follows.service';

// @Controller('follows')
// @UseGuards(JwtAuthGuard)
// export class FollowsController {
//   constructor(private readonly followsService: FollowsService) {}

//   @Post(':targetId')
//   async followUser(@Req() req: any, @Param('targetId') targetId: string) {
//     return this.followsService.followUser(req.user.sub, targetId);
//   }

//   @Delete(':targetId')
//   async unfollowUser(@Req() req: any, @Param('targetId') targetId: string) {
//     return this.followsService.unfollowUser(req.user.sub, targetId);
//   }

//   @Get('followers/:userId')
//   async getFollowers(@Param('userId') userId: string) {
//     return this.followsService.getFollowers(userId);
//   }

//   @Get('following/:userId')
//   async getFollowing(@Param('userId') userId: string) {
//     return this.followsService.getFollowing(userId);
//   }

// @Get('counts/:userId')
// async getCounts(@Param('userId') userId: string) {
//   return this.followsService.getFollowCounts(userId);
// }

// @Get('is-following/:targetId')
// @UseGuards(JwtAuthGuard)
// async isFollowing(@Req() req: any, @Param('targetId') targetId: string) {
//   return { isFollowing: await this.followsService.isFollowing(req.user.sub, targetId) };
// }

// @Get('is-mutual/:targetId')
// @UseGuards(JwtAuthGuard)
// async isMutual(@Req() req: any, @Param('targetId') targetId: string) {
//   return { isMutual: await this.followsService.isMutualFollow(req.user.sub, targetId) };
// }

// }
import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { FollowsService } from './follows.service';

@Controller('follows')
@UseGuards(JwtAuthGuard)
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  // ---------------- FOLLOW / UNFOLLOW ----------------
  @Post(':targetId')
  async followUser(@Req() req: any, @Param('targetId') targetId: string) {
    return this.followsService.followUser(req.user.sub, targetId);
  }

  @Delete(':targetId')
  async unfollowUser(@Req() req: any, @Param('targetId') targetId: string) {
    return this.followsService.unfollowUser(req.user.sub, targetId);
  }

  // ---------------- FOLLOWER / FOLLOWING LISTS ----------------
  @Get('followers/:userId')
  async getFollowers(@Param('userId') userId: string) {
    return this.followsService.getFollowers(userId);
  }

  @Get('following/:userId')
  async getFollowing(@Param('userId') userId: string) {
    return this.followsService.getFollowing(userId);
  }

  // ---------------- COUNTS + MUTUAL RELATION ----------------
  @Get('counts/:userId')
  async getCounts(@Param('userId') userId: string) {
    return this.followsService.getFollowCounts(userId);
  }

  @Get('is-following/:targetId')
  async isFollowing(@Req() req: any, @Param('targetId') targetId: string) {
    return {
      isFollowing: await this.followsService.isFollowing(
        req.user.sub,
        targetId,
      ),
    };
  }

  @Get('is-mutual/:targetId')
  async isMutual(@Req() req: any, @Param('targetId') targetId: string) {
    return {
      isMutual: await this.followsService.isMutualFollow(
        req.user.sub,
        targetId,
      ),
    };
  }
}
