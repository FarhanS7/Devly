import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'supersecretjwtkey_123',
    });
  }

  async validate(payload: any) {
    // Standardize user object: provide both 'sub' (standard) and 'id' (legacy compatibility)
    return { sub: payload.sub, id: payload.sub, email: payload.email, handle: payload.handle };
  }
}
