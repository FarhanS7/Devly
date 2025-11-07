import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_ACCESS_SECRET || 'supersecretjwtkey_123',
    });
  }

  async validate(payload: any) {
    // Attach what you want on req.user
    return { sub: payload.sub, email: payload.email, handle: payload.handle };
  }
}
