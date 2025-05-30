import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ClassSerializerInterceptor, Logger } from '@nestjs/common';

import { AppModule } from '@backend/app/app.module';

/**
 * Bootstraps the NestJS application with global configuration
 * Sets up validation pipes, interceptors, Swagger documentation, and starts the server
 *
 * @returns {Promise<void>} Promise that resolves when the application is running
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const globalPrefix = 'api';

  app.setGlobalPrefix(globalPrefix);

  app.enableCors({
    origin: [process.env.ALLOWED_ORIGINS || 'http://localhost:4200'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const config = new DocumentBuilder()
    .setTitle('FullStack Chat Application API')
    .setDescription(
      `Complete API for a real-time chat application with WebSocket support.\n\n
      ## Features
      - **JWT Authentication**: Registration, login, session management
      - **User Management**: Complete CRUD operations
      - **Real-time Messages**: Send, edit, delete messages
      - **Chat Rooms**: Direct conversations and member management
      - **Online Presence**: Track connected users\n\n
      ## Authentication
      Most endpoints require a JWT token in the Authorization header.\n
      `
    )
    .setVersion('1.0')
    .addTag(
      'Authentication & User Session',
      'Endpoints for authentication and session management'
    )
    .addTag('User Management', 'User management operations (mixed access)')
    .addTag('Messages & Rooms', 'Message and chat room management')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter your JWT token (without the "Bearer " prefix)',
        in: 'header',
      },
      'JWT-auth'
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${globalPrefix}/docs`, app, document);

  const port = process.env.PORT || 3000;

  await app.listen(port);

  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
  Logger.log(
    `🚀 Swagger is running on: http://localhost:${port}/${globalPrefix}/docs`
  );
}

bootstrap();
