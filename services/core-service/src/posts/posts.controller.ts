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
import { CommentsService } from '../comments/comments.service';
import { CreateCommentDto } from '././dto/create-comment.dto';
import { CreatePostDto } from '././dto/create-post.dto';
import { UpdatePostDto } from '././dto/update-post.dto';
import { PostsService } from './services/posts.service';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly commentsService: CommentsService, // <-- inject
  ) {}

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

  // ---------------- COMMENT (delegates to CommentsService) ----------------
  @Post(':id/comment')
  async comment(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
  ) {
    // maps existing route to the new service
    return this.commentsService.create(req.user.sub, id, {
      // content: dto.text ?? dto['content'] ?? '', // backward compatibility if previous dto had "text"
      content: (dto as any).text ?? (dto as any).content ?? '',

      parentId: (dto as any).parentId,
    });
  }
  // ---------------- USER POSTS ----------------
  @Get('user/:handle')
  async getPostsByUser(@Param('handle') handle: string) {
    return this.postsService.getPostsByHandle(handle);
  }
}
