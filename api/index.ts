import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
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

