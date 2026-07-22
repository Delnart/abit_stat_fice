import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ApiController } from './api/api.controller';
import { ApplicantsLatestSchema, OfferSchema, SnapshotSchema } from './db/schemas';
import { EdboClient } from './scraper/edbo-client';
import { ScrapeService } from './scraper/scrape.service';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: () => ({ uri: process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27017/vstup' }),
    }),
    MongooseModule.forFeature([
      { name: 'Offer', schema: OfferSchema },
      { name: 'ApplicantsLatest', schema: ApplicantsLatestSchema },
      { name: 'Snapshot', schema: SnapshotSchema },
    ]),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
  ],
  controllers: [ApiController],
  providers: [EdboClient, ScrapeService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
