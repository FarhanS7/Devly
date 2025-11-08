import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Extract refresh token from cookies or header
        (req: Request) => {
          if (req && req.cookies && req.cookies.refresh_token) {
            return req.cookies.refresh_token;
          }
          // Fallback: Authorization: Bearer <token>
          return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
        },
      ]),
      secretOrKey: process.env.JWT_REFRESH_SECRET || 'superrefreshkey_123',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    // Optional: Validate that the refresh token still matches user's session
    const token =
      req.cookies?.refresh_token || req.headers.authorization?.split(' ')[1];

    if (!token) throw new UnauthorizedException('Refresh token missing');

    return {
      sub: payload.sub,
      email: payload.email,
      handle: payload.handle,
      token,
    };
  }
}
