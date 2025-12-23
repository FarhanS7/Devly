import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
    credentials: true,
  });

  // Enable websockets via the Nest socket.io adapter
  app.useWebSocketAdapter(new IoAdapter(app));

  const port = process.env.PORT || 3005;
  await app.listen(port, '0.0.0.0');
  console.log(
    ` Notifications service running on port ${process.env.PORT || 3005}`,
  );
}
bootstrap();
