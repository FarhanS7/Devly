import { TeamRole } from '@prisma/client';
export declare class AddTeamMemberDto {
    userId: string;
    role?: TeamRole;
}
