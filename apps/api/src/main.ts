import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Allow Angular dev server
  app.enableCors({
    origin: 'http://localhost:4200',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: false,
  });

  // (optional) global validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidUnknownValues: false }));

  await app.listen(3000);
  console.log('API ready at http://localhost:3000');
}
bootstrap();
