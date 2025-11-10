// import {
//   Body,
//   Controller,
//   Get,
//   HttpCode,
//   HttpStatus,
//   Post,
//   Req,
//   UseGuards,
// } from '@nestjs/common';
// import { LoginDto } from '../dto/login.dto';
// import { RefreshTokenDto } from '../dto/refresh-token.dto';
// import { RegisterDto } from '../dto/register.dto';
// import { JwtAuthGuard } from '../guards/jwt.guard';
// import { AuthService } from './auth.service';
// // import { AuthService } from './services/auth.service';
// import { LogoutDto } from '../dto/logout.dto';

// @Controller('auth')
// export class AuthController {
//   constructor(private readonly auth: AuthService) {}

//   @Post('register')
//   async register(@Body() dto: RegisterDto) {
//     return this.auth.register(dto);
//   }

//   @Post('login')
//   @HttpCode(HttpStatus.OK)
//   async login(@Body() dto: LoginDto) {
//     return this.auth.login(dto);
//   }

//   @Post('refresh')
//   @HttpCode(HttpStatus.OK)
//   async refresh(@Body() dto: RefreshTokenDto) {
//     return this.auth.refresh(dto.refreshToken);
//   }

//   @UseGuards(JwtAuthGuard)
//   @Post('logout')
//   @HttpCode(HttpStatus.OK)
//   // async logout(@Req() req: any) {
//   //   // req.user set by JwtStrategy validate()
//   //   return this.auth.logout(req.user.sub);
//   // }

//   // (Optional quick check)
//   @UseGuards(JwtAuthGuard)
//   @Get('me')
//   me(@Req() req: any) {
//     return req.user;
//   }
//   @Post('logout')
//   @UseGuards(JwtAuthGuard)
//   async logout(@Body() dto: LogoutDto) {
//     await this.auth.logout(dto.refreshToken);
//     return { success: true };
//   }

//   // Revoke all refresh tokens for current user
//   @Post('logout-all')
//   @UseGuards(JwtAuthGuard)
//   async logoutAll(@Req() req: any) {
//     await this.auth.logoutAll(req.user.sub); // assuming JWT payload has sub=userId
//     return { success: true };
//   }
// }
