import {
  INestApplication,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
    // Optional: log once
    // eslint-disable-next-line no-console
    console.log(" Connected to PostgreSQL via Prisma");
  }

  async enableShutdownHooks(app: INestApplication) {
    (this as any).$on("beforeExit", async () => {
      await app.close();
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
