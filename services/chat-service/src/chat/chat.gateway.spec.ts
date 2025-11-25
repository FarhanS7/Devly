import { Test, TestingModule } from '@nestjs/testing';
import { Socket } from 'socket.io';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let chatService: ChatService;

  const mockChatService = {
    isParticipant: jest.fn(),
    saveMessage: jest.fn(),
    markRead: jest.fn(),
  };

  const mockSocket = {
    id: 'socket-1',
    join: jest.fn(),
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  } as unknown as Socket;

  const mockServer = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        {
          provide: ChatService,
          useValue: mockChatService,
        },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
    chatService = module.get<ChatService>(ChatService);
    gateway.server = mockServer as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should log when a client connects', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      gateway.handleConnection(mockSocket);

      expect(consoleSpy).toHaveBeenCalledWith(`Client connected: ${mockSocket.id}`);
      consoleSpy.mockRestore();
    });
  });

  describe('handleDisconnect', () => {
    it('should log when a client disconnects', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      gateway.handleDisconnect(mockSocket);

      expect(consoleSpy).toHaveBeenCalledWith(`Client disconnected: ${mockSocket.id}`);
      consoleSpy.mockRestore();
    });
  });

  describe('handleJoinRoom', () => {
    it('should allow user to join room if they are a participant', async () => {
      const payload = { conversationId: 'conv-1', userId: 'user-1' };
      mockChatService.isParticipant.mockResolvedValue(true);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await gateway.handleJoinRoom(mockSocket, payload);

      expect(mockChatService.isParticipant).toHaveBeenCalledWith('user-1', 'conv-1');
      expect(mockSocket.join).toHaveBeenCalledWith('conv-1');
      expect(consoleSpy).toHaveBeenCalledWith('User user-1 joined room conv-1');
      consoleSpy.mockRestore();
    });

    it('should not allow user to join room if they are not a participant', async () => {
      const payload = { conversationId: 'conv-1', userId: 'user-1' };
      mockChatService.isParticipant.mockResolvedValue(false);
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await gateway.handleJoinRoom(mockSocket, payload);

      expect(mockChatService.isParticipant).toHaveBeenCalledWith('user-1', 'conv-1');
      expect(mockSocket.join).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'User user-1 tried to join room conv-1 but is not a participant',
      );
      consoleSpy.mockRestore();
    });
  });

  describe('handleSendMessage', () => {
    it('should save message and broadcast to room', async () => {
      const payload = {
        conversationId: 'conv-1',
        userId: 'user-1',
        content: 'Hello',
      };

      const mockMessage = {
        id: 'msg-1',
        content: 'Hello',
        conversationId: 'conv-1',
        senderId: 'user-1',
        createdAt: new Date(),
        sender: { id: 'user-1', name: 'John', avatarUrl: null, handle: 'john' },
      };

      mockChatService.saveMessage.mockResolvedValue(mockMessage);

      await gateway.handleSendMessage(mockSocket, payload);

      expect(mockChatService.saveMessage).toHaveBeenCalledWith('user-1', payload);
      expect(mockServer.to).toHaveBeenCalledWith('conv-1');
      expect(mockServer.emit).toHaveBeenCalledWith('newMessage', mockMessage);
    });

    it('should handle message with attachment', async () => {
      const payload = {
        conversationId: 'conv-1',
        userId: 'user-1',
        attachmentUrl: '/uploads/chat/image.jpg',
      };

      const mockMessage = {
        id: 'msg-1',
        content: null,
        attachmentUrl: '/uploads/chat/image.jpg',
        conversationId: 'conv-1',
        senderId: 'user-1',
        createdAt: new Date(),
        sender: { id: 'user-1', name: 'John', avatarUrl: null, handle: 'john' },
      };

      mockChatService.saveMessage.mockResolvedValue(mockMessage);

      await gateway.handleSendMessage(mockSocket, payload);

      expect(mockChatService.saveMessage).toHaveBeenCalledWith('user-1', payload);
      expect(mockServer.to).toHaveBeenCalledWith('conv-1');
      expect(mockServer.emit).toHaveBeenCalledWith('newMessage', mockMessage);
    });
  });

  describe('handleMarkRead', () => {
    it('should mark message as read and notify others in room', async () => {
      const payload = {
        conversationId: 'conv-1',
        userId: 'user-1',
        messageId: 'msg-1',
      };

      mockChatService.markRead.mockResolvedValue({});

      await gateway.handleMarkRead(mockSocket, payload);

      expect(mockChatService.markRead).toHaveBeenCalledWith('user-1', 'conv-1', 'msg-1');
      expect(mockSocket.to).toHaveBeenCalledWith('conv-1');
      expect(mockSocket.emit).toHaveBeenCalledWith('messageRead', {
        userId: 'user-1',
        messageId: 'msg-1',
        conversationId: 'conv-1',
      });
    });
  });
});
