import Redis from 'ioredis';
export declare class PresenceService {
    private readonly redis;
    private readonly logger;
    constructor(redis: Redis);
    setUserOnline(userId: string, socketId: string): Promise<void>;
    setUserOffline(userId: string): Promise<void>;
    updateLastSeen(userId: string): Promise<void>;
    isUserOnline(userId: string): Promise<boolean>;
    getOnlineUsers(userIds: string[]): Promise<string[]>;
    getAllOnlineUsers(): Promise<string[]>;
    startTyping(userId: string, channelId: string): Promise<void>;
    stopTyping(userId: string, channelId: string): Promise<void>;
    getTypingUsers(channelId: string): Promise<string[]>;
    cacheUnreadCount(userId: string, channelId: string, count: number): Promise<void>;
    getCachedUnreadCount(userId: string, channelId: string): Promise<number | null>;
    clearUnreadCount(userId: string, channelId: string): Promise<void>;
    healthCheck(): Promise<boolean>;
}
