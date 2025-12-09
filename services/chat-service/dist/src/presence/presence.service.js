"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PresenceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresenceService = void 0;
const ioredis_1 = require("@nestjs-modules/ioredis");
const common_1 = require("@nestjs/common");
const ioredis_2 = require("ioredis");
let PresenceService = PresenceService_1 = class PresenceService {
    constructor(redis) {
        this.redis = redis;
        this.logger = new common_1.Logger(PresenceService_1.name);
    }
    async setUserOnline(userId, socketId) {
        const timestamp = Date.now();
        const presenceData = JSON.stringify({
            socketId,
            connectedAt: timestamp,
            lastSeen: timestamp,
        });
        try {
            await this.redis.hset('presence:online', userId, presenceData);
            await this.redis.setex(`presence:online:${userId}`, 300, '1');
            this.logger.log(`User ${userId} is now online`);
        }
        catch (error) {
            this.logger.error(`Failed to set user ${userId} online:`, error);
        }
    }
    async setUserOffline(userId) {
        try {
            await this.redis.hdel('presence:online', userId);
            await this.redis.del(`presence:online:${userId}`);
            this.logger.log(`User ${userId} is now offline`);
        }
        catch (error) {
            this.logger.error(`Failed to set user ${userId} offline:`, error);
        }
    }
    async updateLastSeen(userId) {
        try {
            const data = await this.redis.hget('presence:online', userId);
            if (data) {
                const presence = JSON.parse(data);
                presence.lastSeen = Date.now();
                await this.redis.hset('presence:online', userId, JSON.stringify(presence));
                await this.redis.expire(`presence:online:${userId}`, 300);
            }
        }
        catch (error) {
            this.logger.error(`Failed to update last seen for user ${userId}:`, error);
        }
    }
    async isUserOnline(userId) {
        try {
            const exists = await this.redis.hexists('presence:online', userId);
            return exists === 1;
        }
        catch (error) {
            this.logger.error(`Failed to check if user ${userId} is online:`, error);
            return false;
        }
    }
    async getOnlineUsers(userIds) {
        if (!userIds || userIds.length === 0) {
            return [];
        }
        try {
            const pipeline = this.redis.pipeline();
            userIds.forEach((id) => pipeline.hexists('presence:online', id));
            const results = await pipeline.exec();
            return userIds.filter((_, idx) => results && results[idx] && results[idx][1] === 1);
        }
        catch (error) {
            this.logger.error('Failed to get online users:', error);
            return [];
        }
    }
    async getAllOnlineUsers() {
        try {
            return await this.redis.hkeys('presence:online');
        }
        catch (error) {
            this.logger.error('Failed to get all online users:', error);
            return [];
        }
    }
    async startTyping(userId, channelId) {
        try {
            const key = `typing:channel:${channelId}`;
            await this.redis.sadd(key, userId);
            await this.redis.expire(key, 10);
            this.logger.debug(`User ${userId} started typing in channel ${channelId}`);
        }
        catch (error) {
            this.logger.error(`Failed to set typing for user ${userId}:`, error);
        }
    }
    async stopTyping(userId, channelId) {
        try {
            const key = `typing:channel:${channelId}`;
            await this.redis.srem(key, userId);
            this.logger.debug(`User ${userId} stopped typing in channel ${channelId}`);
        }
        catch (error) {
            this.logger.error(`Failed to remove typing for user ${userId}:`, error);
        }
    }
    async getTypingUsers(channelId) {
        try {
            const key = `typing:channel:${channelId}`;
            return await this.redis.smembers(key);
        }
        catch (error) {
            this.logger.error(`Failed to get typing users for channel ${channelId}:`, error);
            return [];
        }
    }
    async cacheUnreadCount(userId, channelId, count) {
        try {
            const key = `unread:${userId}:${channelId}`;
            await this.redis.setex(key, 3600, count.toString());
        }
        catch (error) {
            this.logger.error('Failed to cache unread count:', error);
        }
    }
    async getCachedUnreadCount(userId, channelId) {
        try {
            const key = `unread:${userId}:${channelId}`;
            const count = await this.redis.get(key);
            return count ? parseInt(count, 10) : null;
        }
        catch (error) {
            this.logger.error('Failed to get cached unread count:', error);
            return null;
        }
    }
    async clearUnreadCount(userId, channelId) {
        try {
            const key = `unread:${userId}:${channelId}`;
            await this.redis.del(key);
        }
        catch (error) {
            this.logger.error('Failed to clear unread count:', error);
        }
    }
    async healthCheck() {
        try {
            const result = await this.redis.ping();
            return result === 'PONG';
        }
        catch (error) {
            this.logger.error('Redis health check failed:', error);
            return false;
        }
    }
};
exports.PresenceService = PresenceService;
exports.PresenceService = PresenceService = PresenceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, ioredis_1.InjectRedis)()),
    __metadata("design:paramtypes", [ioredis_2.default])
], PresenceService);
//# sourceMappingURL=presence.service.js.map