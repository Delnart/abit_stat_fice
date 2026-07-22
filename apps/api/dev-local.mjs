// Локальний запуск API без Atlas: in-memory Mongo + сід конфіга місць + перший скрейп.
// Використання: npm run build && node dev-local.mjs   (API на http://localhost:8080)
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

const OFFERS = (process.env.OFFER_IDS ?? '1589232').split(',');
const PORT = process.env.PORT ?? '8080';

const mongo = await MongoMemoryServer.create();
process.env.MONGO_URI = mongo.getUri('vstup');
process.env.OFFER_IDS = OFFERS.join(',');
process.env.CRON_SECRET = process.env.CRON_SECRET ?? 'dev';
process.env.PORT = PORT;

// конфіг місць (руками, як на старті кампанії); для невідомих оферів — 0 → рахуємо з order_budget
const conn = await mongoose.createConnection(process.env.MONGO_URI).asPromise();
await conn.collection('offers').updateOne(
  { offerId: '1589232' },
  { $set: { title: 'С4 Психологія (демо, ПНПУ)', seatsMax: 20, seatsQ1: 2, seatsQ2: 2, enabled: true, sortOrder: 1 } },
  { upsert: true },
);
await conn.close();

await import('./dist/main.js');

// перший скрейп одразу після старту, далі — руками: /api/cron/scrape?token=dev
setTimeout(async () => {
  const r = await fetch(`http://localhost:${PORT}/api/cron/scrape?token=${process.env.CRON_SECRET}`);
  console.log('перший скрейп:', JSON.stringify(await r.json()));
}, 1500);
