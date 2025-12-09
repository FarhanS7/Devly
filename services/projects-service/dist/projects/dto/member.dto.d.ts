export declare enum MemberRole {
    OWNER = "OWNER",
    EDITOR = "EDITOR",
    VIEWER = "VIEWER"
}
export declare class AddMemberDto {
    userId: string;
    role?: MemberRole;
}
export declare class UpdateMemberRoleDto {
    role: MemberRole;
}
