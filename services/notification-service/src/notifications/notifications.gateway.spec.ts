import { Test, TestingModule } from '@nestjs/testing';
import { Socket } from 'socket.io';
import { NotificationsGateway } from './notifications.gateway';

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationsGateway],
    }).compile();

    gateway = module.get<NotificationsGateway>(NotificationsGateway);
    // Mock the server
    gateway.server = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as any;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should disconnect if no userId', () => {
      const client = {
        handshake: { query: {} },
        disconnect: jest.fn(),
      } as unknown as Socket;

      gateway.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalledWith(true);
    });

    it('should join room if userId is present', () => {
      const client = {
        id: 'socket-1',
        handshake: { query: { userId: 'user-1' } },
        join: jest.fn(),
        emit: jest.fn(),
      } as unknown as Socket;

      gateway.handleConnection(client);

      expect(client.join).toHaveBeenCalledWith('user:user-1');
      expect(client.emit).toHaveBeenCalledWith('connected', { ok: true, userId: 'user-1' });
    });
  });

  describe('emitToUser', () => {
    it('should emit event to user room', () => {
      const userId = 'user-1';
      const event = 'test-event';
      const payload = { foo: 'bar' };

      gateway.emitToUser(userId, event, payload);

      expect(gateway.server.to).toHaveBeenCalledWith('user:user-1');
      expect(gateway.server.to('user:user-1').emit).toHaveBeenCalledWith(event, payload);
    });
  });
});
