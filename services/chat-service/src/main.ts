import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';

// Use require for compression due to CommonJS compatibility
const compression = require('compression');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ===========================================
  // 🔐 SECURITY MIDDLEWARE
  // ===========================================
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
  }));
  
  app.use(compression());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS Configuration
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS', 'PUT'],
    credentials: true,
    maxAge: 3600,
  });

  // ===========================================
  // 📁 STATIC FILE SERVING
  // ===========================================
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // ===========================================
  // 🚀 START SERVER
  // ===========================================
  const port = process.env.PORT || 3002; // Fixed: was 3004, should be 3002
  await app.listen(port, '0.0.0.0');

  console.log(`Chat service running on port ${port}`);
}

bootstrap();

