// import { Module } from '@nestjs/common';
// import { JwtStrategy } from '../auth/strategies/jwt.strategy'; // ensures guards work
// import { PrismaService } from '../prisma/prisma.service';
// import { PostsController } from './posts.controller';
// import { PostsService } from './services/posts.service';

// @Module({
//   controllers: [PostsController],
//   providers: [PostsService, PrismaService, JwtStrategy],
// })
// export class PostsModule {}
import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PostsController } from './posts.controller';
import { PostsService } from './services/posts.service';

@Module({
  controllers: [PostsController],
  providers: [PostsService, PrismaService],
  exports: [PostsService],
})
export class PostsModule {}
