import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
      allowedHeaders:
        'Content-Type, x-site-id, x-api-key, Accept, Authorization, X-Requested-With, Apollo-Require-Preflight, ngrok-skip-browser-warning',
    },
  });

  const configService = app.get(ConfigService);

  // Set Global Prefix to match API Spec
  app.setGlobalPrefix('api/v1');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  const port = configService.get('PORT') || 4040;
  await app.listen(port);

  console.log(`🚀 Visitor Intelligence API running on port ${port}/api/v1`);
}

bootstrap();
