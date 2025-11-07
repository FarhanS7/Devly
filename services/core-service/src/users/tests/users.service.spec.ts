import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../services/users.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn() as any,
        update: jest.fn() as any,
      },
    } as unknown as PrismaService;

    service = new UsersService(prisma);
  });

  // -----------------------------
  // GET PROFILE TESTS
  // -----------------------------
  it('should return profile data for valid userId', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'john@example.com',
      handle: 'john',
      bio: 'developer',
      location: 'Dhaka',
      createdAt: new Date(),
    });

    const result = await service.getProfile('u1');

    expect(result.email).toBe('john@example.com');
    expect(prisma.user.findUnique).toHaveBeenCalled();
  });

  it('should throw NotFoundException if user not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.getProfile('x')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  // -----------------------------
  // UPDATE PROFILE TESTS
  // -----------------------------
  it('should update user successfully', async () => {
    prisma.user.update.mockResolvedValue({
      id: 'u1',
      email: 'john@example.com',
      handle: 'john',
      bio: 'Updated bio',
      location: 'NY',
      updatedAt: new Date(),
    });

    const result = await service.updateProfile('u1', {
      bio: 'Updated bio',
      location: 'NY',
    });

    expect(result.bio).toBe('Updated bio');
    expect(prisma.user.update).toHaveBeenCalled();
  });

  // -----------------------------
  // GET PUBLIC PROFILE TESTS
  // -----------------------------
  it('should return public profile by handle', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      handle: 'john',
      bio: 'Hello world',
      location: 'Dhaka',
    });

    const result = await service.getPublicProfile('john');
    expect(result.handle).toBe('john');
  });

  it('should throw NotFoundException for invalid handle', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.getPublicProfile('nope')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
