import { ChannelType } from '@prisma/client';
export declare class CreateChannelDto {
    name: string;
    description?: string;
    type?: ChannelType;
}
