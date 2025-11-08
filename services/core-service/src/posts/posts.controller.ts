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
import { CreateCommentDto } from '././dto/create-comment.dto';
import { CreatePostDto } from '././dto/create-post.dto';
import { UpdatePostDto } from '././dto/update-post.dto';
import { PostsService } from './services/posts.service';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // ---------------- CREATE ----------------
  @Post('create')
  async create(@Req() req: any, @Body() dto: CreatePostDto) {
    return this.postsService.createPost(req.user.sub, dto);
  }

  // ---------------- FEED ----------------
  @Get('feed')
  async feed(@Query('cursor') cursor?: string, @Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    return this.postsService.getFeed({ cursor, limit: parsedLimit });
  }

  // ---------------- SINGLE POST ----------------
  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.postsService.getPostById(id);
  }

  // ---------------- UPDATE ----------------
  @Patch(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postsService.updatePost(req.user.sub, id, dto);
  }

  // ---------------- DELETE ----------------
  @Delete(':id')
  @HttpCode(200)
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.postsService.deletePost(req.user.sub, id);
  }

  // ---------------- LIKE ----------------
  @Post(':id/like')
  async like(@Req() req: any, @Param('id') id: string) {
    return this.postsService.toggleLike(req.user.sub, id);
  }

  // ---------------- COMMENT ----------------
  @Post(':id/comment')
  async comment(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.postsService.addComment(req.user.sub, id, dto);
  }
}
