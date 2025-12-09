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

  // CORS Configuration
  app.enableCors({
    origin: true,
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

