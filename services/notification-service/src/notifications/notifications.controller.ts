import { Controller, Get, Headers, Param, Patch, UnauthorizedException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

// Helper to extract userId from JWT token (simplified - in production use proper JWT validation)
function extractUserIdFromToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  try {
    const token = authHeader.split(' ')[1];
    // Decode JWT payload (base64url) - this is simplified, use proper JWT lib in production
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    return payload.sub || payload.userId || null;
  } catch {
    return null;
  }
}

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  // GET /notifications - Get notifications for current authenticated user
  @Get()
  async getMyNotifications(@Headers('authorization') authHeader: string) {
    const userId = extractUserIdFromToken(authHeader);
    if (!userId) {
      throw new UnauthorizedException('Invalid or missing authentication token');
    }
    return this.notifications.getUserNotifications(userId);
  }

  // GET /notifications/:userId - Get notifications for a specific user (admin/debug use)
  @Get(':userId')
  async getUserNotifications(@Param('userId') userId: string) {
    return this.notifications.getUserNotifications(userId);
  }

  // PATCH /notifications/:id/read - Mark a notification as read
  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.notifications.markAsRead(id);
  }
}
