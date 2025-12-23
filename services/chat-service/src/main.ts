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

  // CORS Configuration - Whitelist only frontend URL for security
  const allowedOrigins = process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
    : ['http://localhost:8080', 'http://127.0.0.1:8080'];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
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

