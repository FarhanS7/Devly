import { ChannelsService } from './channels.service';
import { AddChannelMemberDto } from './dto/add-member.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
export declare class ChannelsController {
    private readonly channelsService;
    constructor(channelsService: ChannelsService);
    findOne(id: string, req: any): Promise<{
        team: {
            id: string;
            name: string;
            slug: string;
        };
        _count: {
            messages: number;
        };
        members: ({
            user: {
                id: string;
                handle: string;
                name: string;
                avatarUrl: string;
            };
        } & {
            id: string;
            channelId: string;
            userId: string;
            joinedAt: Date;
            lastReadMessageId: string | null;
        })[];
    } & {
        type: import(".prisma/client").$Enums.ChannelType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        teamId: string;
        slug: string;
        description: string | null;
    }>;
    update(id: string, req: any, updateChannelDto: UpdateChannelDto): Promise<{
        _count: {
            messages: number;
            members: number;
        };
    } & {
        type: import(".prisma/client").$Enums.ChannelType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        teamId: string;
        slug: string;
        description: string | null;
    }>;
    remove(id: string, req: any): Promise<{
        type: import(".prisma/client").$Enums.ChannelType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        teamId: string;
        slug: string;
        description: string | null;
    }>;
    addMember(id: string, req: any, addMemberDto: AddChannelMemberDto): Promise<{
        user: {
            id: string;
            handle: string;
            name: string;
            avatarUrl: string;
        };
    } & {
        id: string;
        channelId: string;
        userId: string;
        joinedAt: Date;
        lastReadMessageId: string | null;
    }>;
    removeMember(id: string, userId: string, req: any): Promise<{
        id: string;
        channelId: string;
        userId: string;
        joinedAt: Date;
        lastReadMessageId: string | null;
    }>;
    getMessages(id: string, req: any, limit?: string, cursor?: string): Promise<{
        messages: ({
            sender: {
                id: string;
                handle: string;
                name: string;
                avatarUrl: string;
            };
            _count: {
                replies: number;
                reactions: number;
            };
        } & {
            id: string;
            channelId: string;
            senderId: string;
            content: string | null;
            attachmentUrl: string | null;
            createdAt: Date;
            updatedAt: Date;
            parentId: string | null;
        })[];
        nextCursor: string;
    }>;
}
