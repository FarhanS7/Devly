import { AddMemberDto, UpdateMemberRoleDto } from './dto/member.dto';
import { MembersService } from './services/members.service';
export declare class MembersController {
    private readonly membersService;
    constructor(membersService: MembersService);
    addMember(userId: string, projectId: string, dto: AddMemberDto): Promise<{
        user: {
            id: string;
            name: string | null;
            handle: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        projectId: string;
        userId: string;
        role: import("@prisma/client").$Enums.MemberRole;
        joinedAt: Date;
    }>;
    getMembers(userId: string, projectId: string): Promise<({
        user: {
            id: string;
            name: string | null;
            handle: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        projectId: string;
        userId: string;
        role: import("@prisma/client").$Enums.MemberRole;
        joinedAt: Date;
    })[]>;
    updateMemberRole(userId: string, projectId: string, memberId: string, dto: UpdateMemberRoleDto): Promise<{
        user: {
            id: string;
            name: string | null;
            handle: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        projectId: string;
        userId: string;
        role: import("@prisma/client").$Enums.MemberRole;
        joinedAt: Date;
    }>;
    removeMember(userId: string, projectId: string, memberId: string): Promise<{
        success: boolean;
    }>;
}
