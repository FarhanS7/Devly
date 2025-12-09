import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true, // Allow all origins with credentials
    credentials: true,
  });

  // Enable websockets via the Nest socket.io adapter
  app.useWebSocketAdapter(new IoAdapter(app));

  await app.listen(process.env.PORT || 3002);
  console.log(
    ` Notifications service running on port ${process.env.PORT || 3002}`,
  );
}
bootstrap();
