import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
interface AuthenticatedSocket extends Socket {
    user?: {
        sub: string;
        email: string;
        handle?: string;
    };
}
export declare class ProjectsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private socketUser;
    handleConnection(client: AuthenticatedSocket): void;
    handleDisconnect(client: AuthenticatedSocket): void;
    handleJoinProject(client: AuthenticatedSocket, payload: {
        projectId: string;
    }): void;
    handleLeaveProject(client: AuthenticatedSocket, payload: {
        projectId: string;
    }): void;
    emitToProject(projectId: string, event: string, payload: any): void;
    emitToUser(userId: string, event: string, payload: any): void;
    handleSubscribeNotifications(client: AuthenticatedSocket): void;
}
export {};
