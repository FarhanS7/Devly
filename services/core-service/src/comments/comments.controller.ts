import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  // ---------------- CREATE ----------------
  // Create a new comment (top-level or reply)
  @Post(':postId')
  async create(
    @Req() req: any,
    @Param('postId') postId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.comments.create(req.user.sub, postId, dto);
  }

  // ---------------- GET POST COMMENTS ----------------
  // Returns nested comments (tree up to 'depth')
  @Get('post/:postId')
  async getForPost(
    @Param('postId') postId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limitRaw?: string,
    @Query('depth') depthRaw?: string,
  ) {
    const limit = limitRaw ? parseInt(limitRaw, 10) : undefined;
    const depth = depthRaw ? parseInt(depthRaw, 10) : undefined;
    return this.comments.getForPost({ postId, cursor, limit, depth });
  }

  // ---------------- GET THREAD ----------------
  // Returns a comment and its nested replies
  @Get(':commentId/thread')
  async getThread(
    @Param('commentId') commentId: string,
    @Query('depth') depthRaw?: string,
  ) {
    const depth = depthRaw ? parseInt(depthRaw, 10) : undefined;
    return this.comments.getThread(commentId, depth ?? 3);
  }

  // ---------------- UPDATE ----------------
  // Edit own comment
  @Patch(':commentId')
  async update(
    @Req() req: any,
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.comments.update(req.user.sub, commentId, dto);
  }

  // ---------------- DELETE ----------------
  // Soft delete own comment
  @Delete(':commentId')
  async softDelete(@Req() req: any, @Param('commentId') commentId: string) {
    return this.comments.softDelete(req.user.sub, commentId);
  }
}
