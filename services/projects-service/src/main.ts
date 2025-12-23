import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ===========================================
  // 🔐 SECURITY MIDDLEWARE
  // ===========================================
  app.use(helmet());
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
  // 🚀 START SERVER
  // ===========================================
  const port = process.env.PORT || 3006;
  await app.listen(port, '0.0.0.0');

  console.log(`Projects Service running on port ${port}`);
}

bootstrap();

