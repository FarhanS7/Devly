// import { Controller, Get, Param, Patch } from '@nestjs/common';
// import { NotificationsService } from './notifications.service';

// @Controller('notifications')
// export class NotificationsController {
//   constructor(private readonly notifications: NotificationsService) {}

//   @Get(':userId')
//   async getUserNotifications(@Param('userId') userId: string) {
//     return this.notifications.getUserNotifications(userId);
//   }

//   @Patch(':userId/:id/read')
//   async markAsRead(@Param('userId') userId: string, @Param('id') id: string) {
//     return this.notifications.markAsRead(userId, id);
//   }
// }
import { Controller, Get, Param, Patch } from '@nestjs/common';
// Removed cross-service import - services should not import from each other
// Authentication should be handled via API Gateway or shared package
// import { JwtAuthGuard } from '../../../core-service/src/auth/guards/jwt.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
// @UseGuards(JwtAuthGuard) // Re-enable when auth is properly configured
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get(':userId')
  async getMyNotifications(@Param('userId') userId: string) {
    return this.notifications.getUserNotifications(userId);
  }

  @Get(':userId')
  async getUserNotifications(@Param('userId') userId: string) {
    return this.notifications.getUserNotifications(userId);
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.notifications.markAsRead(id);
  }
}
