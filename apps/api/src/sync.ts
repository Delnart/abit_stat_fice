import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ScrapeService } from './scraper/scrape.service';

async function bootstrap() {
  console.log('Ініціалізація бази даних та парсера...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const scraper = app.get(ScrapeService);
  
  console.log("Запуск парсингу з локального комп'ютера (обхід блокування ЄДЕБО)...");
  const result = await scraper.runAll();
  
  console.log('Готово! Результат:', result);
  await app.close();
  process.exit(0);
}

bootstrap();
