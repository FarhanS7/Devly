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
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With'
    ],
    credentials: true,
  });

  // Security Middleware
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

  // Static File Serving
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

  console.log(`Core service is running on port ${port}`);
}

bootstrap();
