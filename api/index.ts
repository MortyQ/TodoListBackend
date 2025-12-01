import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import { AppConfigService } from '../src/config/app-config.service';
import express = require('express');

const server = express();
const createServer = async () => {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(server),
    { logger: console }
  );

  app.setGlobalPrefix('api');

  const configService = app.get(AppConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const corsOrigins = configService.corsOrigins;
  app.enableCors({
    origin: corsOrigins === '*' ? true : corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Authorization'],
  });

  // Swagger configuration для Vercel
  const swaggerConfig = new DocumentBuilder()
    .setTitle('MuzalovTodoApp API')
    .setDescription('Todo Backend API built with NestJS + TypeScript + Mongoose for frontend developers learning')
    .setVersion('1.0')
    .addServer('/', 'Current server')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Authentication', 'Registration, login and profile management')
    .addTag('Users', 'User management (admin only)')
    .addTag('Profile', 'Profile management')
    .addTag('Lists', 'Todo lists management')
    .addTag('Tasks', 'Tasks management')
    .addTag('Health', 'API health check')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  // Используем CDN для Swagger UI (работает на Vercel)
  SwaggerModule.setup('docs', app, document, {
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.5/swagger-ui.min.css',
    ],
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.5/swagger-ui-bundle.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.5/swagger-ui-standalone-preset.js',
    ],
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'list',
      filter: true,
      showRequestHeaders: true,
      tryItOutEnabled: true,
    },
    customSiteTitle: 'MuzalovTodoApp API Documentation',
  });

  await app.init();
  return server;
};

let appPromise: Promise<any>;

module.exports = async (req, res) => {
  if (!appPromise) {
    appPromise = createServer();
  }
  const app = await appPromise;
  app(req, res);
};

