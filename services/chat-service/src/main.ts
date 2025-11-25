import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: '*', // Allow all for dev
    methods: ['GET', 'POST'],
    credentials: true,
  });

  // Serve uploads
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  const port = process.env.PORT || 3003; // Different port from core-service (3000)
  await app.listen(port);
  console.log(`🚀 Chat service running on http://localhost:${port}`);
}
bootstrap();
