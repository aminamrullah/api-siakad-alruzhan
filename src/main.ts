import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';

// Load environment variables before anything else
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Security Middlewares
  app.use(helmet());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  app.enableCors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3002', 'http://localhost:3001', 'http://localhost:3000'],
  }); // Mengizinkan akses dari frontend tertentu
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
