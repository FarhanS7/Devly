import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './services/users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@GetUser() user: any) {
    return this.usersService.getProfile(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update')
  updateProfile(@GetUser() user: any, @Body() dto: UpdateUserDto) {
    return this.usersService.updateProfile(user.userId, dto);
  }

  @Get(':handle')
  getPublicProfile(@Param('handle') handle: string) {
    return this.usersService.getPublicProfile(handle);
  }
}
