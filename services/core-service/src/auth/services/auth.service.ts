import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly tokens: TokenService,
  ) {}

  // ------------------ REGISTER ------------------
  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { handle: dto.handle }] },
    });
    if (exists) throw new BadRequestException('Email or handle already taken');

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: { email: dto.email, handle: dto.handle, passwordHash },
    });

    return this.issueTokenPair(user.id, user.email, user.handle, {
      persistRefresh: true,
    });
  }

  // ------------------ LOGIN ------------------
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await argon2.verify(user.passwordHash, dto.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return this.issueTokenPair(user.id, user.email, user.handle, {
      persistRefresh: true,
    });
  }

  // ------------------ REFRESH ------------------
  async refresh(oldRefreshToken: string) {
    let payload: any;
    try {
      payload = await this.jwt.verifyAsync(oldRefreshToken, {
        secret: process.env.JWT_REFRESH_SECRET!,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) throw new UnauthorizedException('Invalid refresh token');

    const newPayload = { sub: user.id, email: user.email, handle: user.handle };
    const newAccess = await this.tokens.signAccessToken(newPayload);
    const newRefresh = await this.tokens.signRefreshToken(newPayload);
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);

    const rotated = await this.tokens.rotateRefreshToken(
      user.id,
      oldRefreshToken,
      newRefresh,
      newExpiresAt,
    );
    if (!rotated)
      throw new UnauthorizedException(
        'Refresh token not recognized or already rotated',
      );

    return { accessToken: newAccess, refreshToken: newRefresh };
  }

  // ------------------ LOGOUT SINGLE ------------------
  async logout(refreshToken: string) {
    await this.tokens.revokeRefreshToken(refreshToken);
    return { success: true };
  }

  // ------------------ LOGOUT ALL ------------------
  async logoutAll(userId: string) {
    await this.tokens.revokeAllForUser(userId);
    return { success: true };
  }

  // ------------------ HELPER ------------------
  private async issueTokenPair(
    userId: string,
    email: string,
    handle: string,
    opts: { persistRefresh: boolean } = { persistRefresh: true },
  ) {
    const payload = { sub: userId, email, handle };
    const accessToken = await this.tokens.signAccessToken(payload);
    const refreshToken = await this.tokens.signRefreshToken(payload);

    if (opts.persistRefresh) {
      const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);
      await this.tokens.storeRefreshToken(userId, refreshToken, expiresAt);
    }

    return { accessToken, refreshToken };
  }
}
