import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  //  Generate Access Token
  async signAccessToken(payload: any): Promise<string> {
    const expiresIn = (process.env.JWT_EXPIRATION ||
      '15m') as JwtSignOptions['expiresIn'];
    return this.jwt.signAsync(payload, {
      secret: process.env.JWT_SECRET!,
      expiresIn,
    });
  }

  // //  Generate Refresh Token
  // async signRefreshToken(payload: any): Promise<string> {
  //   const expiresIn = (process.env.JWT_REFRESH_EXPIRATION ||
  //     '7d') as JwtSignOptions['expiresIn'];
  //   return this.jwt.signAsync(payload, {
  //     secret: process.env.JWT_REFRESH_SECRET!,
  //     expiresIn,
  //   });
  // }

  async signRefreshToken(payload: any): Promise<string> {
    const expiresIn = (process.env.JWT_REFRESH_EXPIRATION ||
      '7d') as JwtSignOptions['expiresIn'];

    //  Add a random identifier (jti) to force uniqueness
    const extendedPayload = { ...payload, jti: crypto.randomUUID() };

    return this.jwt.signAsync(extendedPayload, {
      secret: process.env.JWT_REFRESH_SECRET!,
      expiresIn,
    });
  }

  //  Store refresh token in DB

  async storeRefreshToken(userId: string, token: string, expiresAt: Date) {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
    await this.prisma.refreshToken.create({
      data: { userId, token, expiresAt },
    });
  }
  //  Rotate refresh token (replace old one)
  async rotateRefreshToken(
    userId: string,
    oldToken: string,
    newToken: string,
    expiresAt: Date,
  ): Promise<boolean> {
    // Delete old token first
    const existing = await this.prisma.refreshToken.findFirst({
      where: { userId, token: oldToken },
    });

    if (!existing) return false; // invalid or already rotated

    await this.prisma.refreshToken.delete({
      where: { id: existing.id },
    });

    await this.prisma.refreshToken.create({
      data: { userId, token: newToken, expiresAt },
    });

    return true;
  }

  //  Revoke a specific refresh token
  async revokeRefreshToken(token: string) {
    await this.prisma.refreshToken.deleteMany({ where: { token } });
  }

  //  Revoke all refresh tokens for a user (logout-all)
  async revokeAllForUser(userId: string) {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }

  //  Optional: Verify refresh token exists
  async isRefreshTokenValid(userId: string, token: string): Promise<boolean> {
    const exists = await this.prisma.refreshToken.findFirst({
      where: { userId, token },
    });
    return !!exists;
  }
}
