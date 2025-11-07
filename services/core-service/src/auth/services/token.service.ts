import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';

type JwtPayload = { sub: string; email: string; handle: string };

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  // ------------------ Helpers ------------------
  async hash(value: string) {
    return argon2.hash(value);
  }

  async verifyHash(hashed: string, value: string) {
    return argon2.verify(hashed, value);
  }

  // ------------------ Token Signers ------------------
  async signAccessToken(payload: JwtPayload) {
    return this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret: process.env.JWT_ACCESS_SECRET!,
    });
  }

  async signRefreshToken(payload: JwtPayload) {
    return this.jwt.signAsync(payload, {
      expiresIn: '7d',
      secret: process.env.JWT_REFRESH_SECRET!,
    });
  }

  // ------------------ Token Persistence ------------------
  async storeRefreshToken(userId: string, rawToken: string, expiresAt: Date) {
    const hashed = await this.hash(rawToken);
    await this.prisma.refreshToken.create({
      data: { userId, hashed, expiresAt },
    });
  }

  // Revoke *all* tokens for a user (used in logoutAll)
  async revokeAllForUser(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true, rotatedAt: new Date() },
    });
  }

  // Revoke a *single* token (logout one session)
  async revokeRefreshToken(rawToken: string): Promise<boolean> {
    const tokens = await this.prisma.refreshToken.findMany({
      where: { revoked: false },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    for (const t of tokens) {
      const valid = await this.verifyHash(t.hashed, rawToken);
      if (valid) {
        await this.prisma.refreshToken.update({
          where: { id: t.id },
          data: { revoked: true, rotatedAt: new Date() },
        });
        return true;
      }
    }

    return false;
  }

  // Rotate refresh token (used in refresh)
  async rotateRefreshToken(
    userId: string,
    oldRaw: string,
    newRaw: string,
    newExpiresAt: Date,
  ) {
    const tokens = await this.prisma.refreshToken.findMany({
      where: { userId, revoked: false },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    let matchedId: string | null = null;

    for (const t of tokens) {
      if (await this.verifyHash(t.hashed, oldRaw)) {
        matchedId = t.id;
        break;
      }
    }

    if (!matchedId) return false;

    await this.prisma.refreshToken.update({
      where: { id: matchedId },
      data: { revoked: true, rotatedAt: new Date() },
    });

    const newHashed = await this.hash(newRaw);
    await this.prisma.refreshToken.create({
      data: { userId, hashed: newHashed, expiresAt: newExpiresAt },
    });

    return true;
  }
}
