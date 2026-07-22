import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // публічний read-only API, фронт на іншому домені (Render Static)
  const port = Number(process.env.PORT ?? 8080);
  await app.listen(port);
  console.log(`API на порту ${port}`);
}
bootstrap();
