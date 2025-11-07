// import {
//   Body,
//   Controller,
//   Delete,
//   Get,
//   Param,
//   Patch,
//   Post,
//   Query,
//   Req,
//   UseGuards,
// } from '@nestjs/common';
// import type { Request } from 'express';
// import { JwtAuthGuard } from '../auth/guards/jwt.guard'; // assumes you already have a JwtAuthGuard
// import { CreateCommentDto } from './dto/create-comment.dto';
// import { CreatePostDto } from './dto/create-post.dto';
// import { UpdatePostDto } from './dto/update-post.dto';
// import { PostsService } from './services/posts.service';

// @Controller('posts')
// export class PostsController {
//   constructor(private readonly postsService: PostsService) {}

//   // 🟢 Create new post

//   @Post('create')
//   @UseGuards(JwtAuthGuard)
//   async createPost(@Req() req, @Body() dto: CreatePostDto) {
//     const userId = req.user?.id;
//     return this.postsService.createPost(userId, dto);
//   }

//   // 🟢 Public feed (cursor pagination)
//   @Get('feed')
//   async getFeed(
//     @Query('cursor') cursor?: string,
//     @Query('limit') limit?: number,
//   ) {
//     return this.postsService.getFeed({ cursor, limit });
//   }

//   // 🟢 Get single post by id
//   @Get(':id')
//   async getPost(@Param('id') id: string) {
//     return this.postsService.getPostById(id);
//   }

//   // 🟡 Update post (only author)
//   @UseGuards(JwtAuthGuard)
//   @Patch(':id')
//   async updatePost(
//     @Req() req: Request,
//     @Param('id') id: string,
//     @Body() dto: UpdatePostDto,
//   ) {
//     const user = req.user as { sub: string };
//     return this.postsService.updatePost(user.sub, id, dto);
//   }

//   // 🔴 Delete post (only author)
//   @UseGuards(JwtAuthGuard)
//   @Delete(':id')
//   async deletePost(@Req() req: Request, @Param('id') id: string) {
//     const user = req.user as { sub: string };
//     return this.postsService.deletePost(user.sub, id);
//   }

//   // ❤️ Toggle like/unlike
//   @UseGuards(JwtAuthGuard)
//   @Post(':id/like')
//   async toggleLike(@Req() req: Request, @Param('id') id: string) {
//     const user = req.user as { id: string };
//     return this.postsService.toggleLike(user.id, id);
//   }

//   // 💬 Add comment
//   @UseGuards(JwtAuthGuard)
//   @Post(':id/comment')
//   async addComment(
//     @Req() req: Request,
//     @Param('id') id: string,
//     @Body() dto: CreateCommentDto,
//   ) {
//     const user = req.user as { id: string };
//     return this.postsService.addComment(user.id, id, dto);
//   }
// }
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsService } from './services/posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // ---------------- CREATE ----------------
  @UseGuards(JwtAuthGuard)
  @Post('create')
  async createPost(@Req() req: any, @Body() dto: CreatePostDto) {
    return this.postsService.createPost(req.user.sub, dto);
  }

  // ---------------- FEED (supports pagination) ----------------
  @Get('feed')
  async getFeed(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.postsService.getFeed({
      cursor,
      limit: limit ? parseInt(limit) : 10,
    });
  }

  // ---------------- SINGLE POST ----------------
  @Get(':id')
  async getPost(@Param('id') id: string) {
    return this.postsService.getPostById(id);
  }

  // ---------------- UPDATE ----------------
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updatePost(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postsService.updatePost(req.user.sub, id, dto);
  }

  // ---------------- DELETE ----------------
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deletePost(@Req() req: any, @Param('id') id: string) {
    return this.postsService.deletePost(req.user.sub, id);
  }

  // ---------------- LIKE / TOGGLE ----------------
  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  @HttpCode(200)
  async toggleLike(@Req() req: any, @Param('id') id: string) {
    return this.postsService.toggleLike(req.user.sub, id);
  }

  // ---------------- COMMENT ----------------
  @UseGuards(JwtAuthGuard)
  @Post(':id/comment')
  async addComment(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.postsService.addComment(req.user.sub, id, dto);
  }
}
