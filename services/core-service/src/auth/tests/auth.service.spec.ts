import { UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../services/auth.service';
import { CryptoService } from '../services/crypto.service';
import { TokenService } from '../services/token.service';

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: any;
  let crypto: jest.Mocked<CryptoService>;
  let token: jest.Mocked<TokenService>;

  beforeEach(() => {
    prisma = {
      user: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
      },
    } as unknown as PrismaService;

    crypto = {
      hashPassword: jest.fn(),
      verifyPassword: jest.fn(),
      hashToken: jest.fn(),
      verifyToken: jest.fn(),
    } as any;

    token = {
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      //  NEW: add the verifier so refresh() can call it
      verifyRefreshToken: jest.fn(),
    } as any;

    authService = new AuthService(prisma, crypto, token);
  });

  // ... your existing register/login tests unchanged ...

  it('should issue new tokens on valid refresh', async () => {
    // simulate a decoded valid refresh JWT
    (token.verifyRefreshToken as jest.Mock).mockResolvedValue({
      sub: 'user-1',
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'a@b.com',
      handle: 'h1',
    });
    (token.generateAccessToken as jest.Mock).mockReturnValue('new-access');
    (token.generateRefreshToken as jest.Mock).mockReturnValue('new-refresh');

    const result = await authService.refresh('some-valid-refresh-token');

    expect(result.accessToken).toBe('new-access');
    expect(result.refreshToken).toBe('new-refresh');
    expect(token.verifyRefreshToken).toHaveBeenCalledWith(
      'some-valid-refresh-token',
    );
  });

  it('should throw Unauthorized on invalid refresh', async () => {
    (token.verifyRefreshToken as jest.Mock).mockResolvedValue(null);

    await expect(authService.refresh('x')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
