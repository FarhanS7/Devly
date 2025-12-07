import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ===========================================
  // 🌐 CORS CONFIGURATION - MUST BE FIRST!
  // ===========================================
  // CRITICAL: Enable CORS BEFORE any other middleware
  console.log('!!! APPLYING CORS CONFIGURATION (origin: true) !!!');
  app.enableCors({
    origin: true, // Auto-reflects the requesting origin
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS', 'PUT'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With'
    ],
    credentials: true,
  });

  // ===========================================
  // 🔐 SECURITY MIDDLEWARE
  // ===========================================
  // Helmet adds various HTTP headers for security
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // ✅ Allow images to be loaded from other origins (frontend)
    crossOriginEmbedderPolicy: false, // Allow embedding (adjust based on needs)
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // For Swagger UI
        imgSrc: ["'self'", "data:", "https:", "http://localhost:3000"], // Added backend URL just in case
      },
    },
  }));

  // Compression middleware for response compression
  app.use(compression());

  // Global validation pipe for DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted values exist
      transform: true, // Auto-transform payloads to DTO instances
    }),
  );

  // ===========================================
  // 📁 STATIC FILE SERVING
  // ===========================================
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // ===========================================
  // 📚 SWAGGER API DOCUMENTATION
  // ===========================================
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  if (isDevelopment || process.env.ENABLE_SWAGGER === 'true') {
    const config = new DocumentBuilder()
      .setTitle('DevConnect Core API')
      .setDescription(
        'Backend REST API for DevConnect — includes Auth, Users, Posts, Follows & Notifications',
      )
      .setVersion('1.0')
      .addBearerAuth() // adds "Authorize" button
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true, // keeps token between refreshes
      },
    });
  }

  // ===========================================
  // START SERVER
  // ===========================================
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0'); // Listen on all interfaces for Docker

  console.log(` Core service running on http://localhost:${port}`);
  if (isDevelopment || process.env.ENABLE_SWAGGER === 'true') {
    console.log(` Swagger docs available at http://localhost:${port}/api/docs`);
  }
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`CORS Origins: http://localhost:8080, http://127.0.0.1:8080`);
}

bootstrap();
