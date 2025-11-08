import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //  Global prefix
  app.setGlobalPrefix('api');

  //  Swagger setup
  const config = new DocumentBuilder()
    .setTitle('DevConnect API')
    .setDescription(
      'Backend REST API for DevConnect — includes Auth, Posts, Follows & Notifications',
    )
    .setVersion('1.0')
    .addBearerAuth() // adds “Authorize” button
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // keeps token between refreshes
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Core service running on http://localhost:${port}/api/docs`);
}

bootstrap();
