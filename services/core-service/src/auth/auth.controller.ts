import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt.guard';
import { AuthService } from './services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ------------------ REGISTER ------------------
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } }) // ✅ new format
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // ------------------ LOGIN ------------------
  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // ------------------ REFRESH ------------------
  @Post('refresh')
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  // ------------------ LOGOUT SINGLE ------------------
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async logout(@Body() dto: LogoutDto) {
    await this.authService.logout(dto.refreshToken);
    return { success: true };
  }

  // ------------------ LOGOUT ALL ------------------
  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async logoutAll(@Req() req: any) {
    await this.authService.logoutAll(req.user.sub);
    return { success: true };
  }
}
