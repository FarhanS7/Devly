import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);

  constructor(@InjectRedis() private readonly redis: Redis) {}

  //===============================================
  // USER PRESENCE (Online/Offline)
  //===============================================

  /**
   * Mark user as online
   */
  async setUserOnline(userId: string, socketId: string): Promise<void> {
    const timestamp = Date.now();
    const presenceData = JSON.stringify({
      socketId,
      connectedAt: timestamp,
      lastSeen: timestamp,
    });

    try {
      // Store in hash: presence:online
      await this.redis.hset('presence:online', userId, presenceData);
      
      // Set expiry on user-specific key (5 minutes)
      await this.redis.setex(`presence:online:${userId}`, 300, '1');
      
      this.logger.log(`User ${userId} is now online`);
    } catch (error) {
      this.logger.error(`Failed to set user ${userId} online:`, error);
    }
  }

  /**
   * Mark user as offline
   */
  async setUserOffline(userId: string): Promise<void> {
    try {
      await this.redis.hdel('presence:online', userId);
      await this.redis.del(`presence:online:${userId}`);
      
      this.logger.log(`User ${userId} is now offline`);
    } catch (error) {
      this.logger.error(`Failed to set user ${userId} offline:`, error);
    }
  }

  /**
   * Update user's last seen timestamp
   */
  async updateLastSeen(userId: string): Promise<void> {
    try {
      const data = await this.redis.hget('presence:online', userId);
      if (data) {
        const presence = JSON.parse(data);
        presence.lastSeen = Date.now();
        await this.redis.hset('presence:online', userId, JSON.stringify(presence));
        // Refresh TTL
        await this.redis.expire(`presence:online:${userId}`, 300);
      }
    } catch (error) {
      this.logger.error(`Failed to update last seen for user ${userId}:`, error);
    }
  }

  /**
   * Check if user is online
   */
  async isUserOnline(userId: string): Promise<boolean> {
    try {
      const exists = await this.redis.hexists('presence:online', userId);
      return exists === 1;
    } catch (error) {
      this.logger.error(`Failed to check if user ${userId} is online:`, error);
      return false;
    }
  }

  /**
   * Get list of online users from a set of user IDs
   */
  async getOnlineUsers(userIds: string[]): Promise<string[]> {
    if (!userIds || userIds.length === 0) {
      return [];
    }

    try {
      const pipeline = this.redis.pipeline();
      userIds.forEach((id) => pipeline.hexists('presence:online', id));
      const results = await pipeline.exec();
      
      return userIds.filter((_, idx) => results && results[idx] && results[idx][1] === 1);
    } catch (error) {
      this.logger.error('Failed to get online users:', error);
      return [];
    }
  }

  /**
   * Get all currently online users
   */
  async getAllOnlineUsers(): Promise<string[]> {
    try {
      return await this.redis.hkeys('presence:online');
    } catch (error) {
      this.logger.error('Failed to get all online users:', error);
      return [];
    }
  }

  //===============================================
  // TYPING INDICATORS
  //===============================================

  /**
   * Start typing in a channel (with auto-expire)
   */
  async startTyping(userId: string, channelId: string): Promise<void> {
    try {
      const key = `typing:channel:${channelId}`;
      await this.redis.sadd(key, userId);
      // Auto-expire after 10 seconds
      await this.redis.expire(key, 10);
      
      this.logger.debug(`User ${userId} started typing in channel ${channelId}`);
    } catch (error) {
      this.logger.error(`Failed to set typing for user ${userId}:`, error);
    }
  }

  /**
   * Stop typing in a channel
   */
  async stopTyping(userId: string, channelId: string): Promise<void> {
    try {
      const key = `typing:channel:${channelId}`;
      await this.redis.srem(key, userId);
      
      this.logger.debug(`User ${userId} stopped typing in channel ${channelId}`);
    } catch (error) {
      this.logger.error(`Failed to remove typing for user ${userId}:`, error);
    }
  }

  /**
   * Get list of users currently typing in a channel
   */
  async getTypingUsers(channelId: string): Promise<string[]> {
    try {
      const key = `typing:channel:${channelId}`;
      return await this.redis.smembers(key);
    } catch (error) {
      this.logger.error(`Failed to get typing users for channel ${channelId}:`, error);
      return [];
    }
  }

  //===============================================
  // CACHE HELPERS (Optional)
  //===============================================

  /**
   * Cache unread count for a user/channel
   */
  async cacheUnreadCount(userId: string, channelId: string, count: number): Promise<void> {
    try {
      const key = `unread:${userId}:${channelId}`;
      await this.redis.setex(key, 3600, count.toString()); // 1 hour TTL
    } catch (error) {
      this.logger.error('Failed to cache unread count:', error);
    }
  }

  /**
   * Get cached unread count
   */
  async getCachedUnreadCount(userId: string, channelId: string): Promise<number | null> {
    try {
      const key = `unread:${userId}:${channelId}`;
      const count = await this.redis.get(key);
      return count ? parseInt(count, 10) : null;
    } catch (error) {
      this.logger.error('Failed to get cached unread count:', error);
      return null;
    }
  }

  /**
   * Clear cached unread count
   */
  async clearUnreadCount(userId: string, channelId: string): Promise<void> {
    try {
      const key = `unread:${userId}:${channelId}`;
      await this.redis.del(key);
    } catch (error) {
      this.logger.error('Failed to clear unread count:', error);
    }
  }

  //===============================================
  // HEALTH CHECK
  //===============================================

  /**
   * Check Redis connection health
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      this.logger.error('Redis health check failed:', error);
      return false;
    }
  }
}
