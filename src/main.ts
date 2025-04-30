import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { ValidationExceptionFilter } from './filters/validation-exception.filter';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  //Habilitando CORS
  const allowedOrigins = [process.env.URL_FRONTEND];

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Access-Control-Allow-Headers',
      'Authorization',
    ],
    exposedHeaders: ['Set-Cookie'],
    credentials: true,
  });
  // console.log('📦 Connecting to DB at:', {
  //   host: process.env.DB_HOST,
  //   port: process.env.DB_PORT,
  // });

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new ValidationExceptionFilter());

  await app.listen(process.env.PORT || 6500);
}
bootstrap();
