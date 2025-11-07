import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class CryptoService {
  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password);
  }

  async verifyPassword(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }

  async hashToken(token: string): Promise<string> {
    return argon2.hash(token);
  }

  async verifyToken(hash: string, token: string): Promise<boolean> {
    return argon2.verify(hash, token);
  }
}
