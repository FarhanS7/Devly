import { Body, Controller, Get, Param, Post, Request, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { ChatService } from './chat.service';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/chat',
        filename: (req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, unique + extname(file.originalname));
        },
      }),
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return { url: `/uploads/chat/${file.filename}` };
  }

  @Get('conversations')
  async getConversations(@Request() req: any) {
    return this.chatService.getUserConversations(req.user.sub);
  }

  @Get(':conversationId/messages')
  async getMessages(@Param('conversationId') conversationId: string, @Request() req: any) {
    return this.chatService.getMessages(conversationId, req.user.sub);
  }

  @Post('conversations/start')
  async startConversation(@Request() req: any, @Body() body: { recipientId: string }) {
    return this.chatService.findOrCreateConversation(req.user.sub, body.recipientId);
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    const count = await this.chatService.getUnreadCount(req.user.sub);
    return { unreadCount: count };
  }
}
