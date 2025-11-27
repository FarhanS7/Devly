import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'supersecretjwtkey_123',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [JwtStrategy, WsJwtGuard],
  exports: [JwtModule, PassportModule, WsJwtGuard],
})
export class AuthModule {}
