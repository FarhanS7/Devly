import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client = context.switchToWs().getClient();
      const token = client.handshake?.auth?.token || client.handshake?.headers?.authorization?.split(' ')[1];

      if (!token) {
        throw new WsException('Unauthorized: No token provided');
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'supersecretjwtkey_123',
      });

      // 🔍 DIAGNOSTIC LOGGING (Remove after debugging)
      console.log('╔═══════════════════════════════════════╗');
      console.log('║   WebSocket Connection Authenticated  ║');
      console.log('╠═══════════════════════════════════════╣');
      console.log('║ Socket ID:', client.id);
      console.log('║ User ID:  ', payload.sub);
      console.log('║ Email:    ', payload.email);
      console.log('║ Handle:   ', payload.handle);
      console.log('╚═══════════════════════════════════════╝');

      // Attach user info to socket for later use
      client.user = payload;
      return true;
    } catch (err) {
      throw new WsException('Unauthorized: Invalid token');
    }
  }
}
