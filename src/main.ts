import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS with explicit configuration
  app.enableCors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    exposedHeaders: 'Content-Length, X-Content-Type-Options',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: '*',
    credentials: false,
  });
  app.setGlobalPrefix('api/v1');

  await app.listen(3001);
}
bootstrap();
