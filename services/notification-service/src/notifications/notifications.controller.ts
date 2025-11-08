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
import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../core-service/src/auth/guards/jwt.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  async getMyNotifications(@Req() req: any) {
    return this.notifications.getUserNotifications(req.user.sub);
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
