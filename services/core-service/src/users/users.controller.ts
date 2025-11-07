import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './services/users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // --- GET current profile ---
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req: any) {
    return this.usersService.getProfile(req.user.sub);
  }

  // --- PATCH update profile ---
  @UseGuards(JwtAuthGuard)
  @Patch('update')
  async updateProfile(@Req() req: any, @Body() dto: UpdateUserDto) {
    return this.usersService.updateProfile(req.user.sub, dto);
  }

  // --- GET public user by handle ---
  @Get(':handle')
  @HttpCode(200)
  async getUserByHandle(@Param('handle') handle: string) {
    return this.usersService.getUserByHandle(handle);
  }
}
