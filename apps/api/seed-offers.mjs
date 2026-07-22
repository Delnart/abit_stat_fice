// Сід конфіга 12 конкурсних пропозицій ФІОТ-2026 (ID зібрані руками з vstup.edbo.gov.ua).
// Запуск: npm run seed   (читає MONGO_URI з .env)
import mongoose from 'mongoose';

// seatsMax тут — стартовий орієнтир з обсягів 2025; щойно ЄДЕБО віддасть order_budget,
// парсер перепише його автоматично (ЄДЕБО — джерело правди)
const OFFERS = [
  { offerId: '1586544', group: 'f2',  form: 'денна',        title: 'Інженерія програмного забезпечення', seatsMax: 220, sortOrder: 10, prev2025: { apps: 2159, cutoff: 164 } },
  { offerId: '1639860', group: 'f2i', form: 'денна',        title: 'Програмування компʼютерних ігор', seatsMax: 50, sortOrder: 20, prev2025: { apps: 466, cutoff: 150.667 } },
  { offerId: '1591057', group: 'f6',  form: 'денна',        title: 'Інформаційні системи і технології', seatsMax: 280, sortOrder: 30, prev2025: { apps: 1019, cutoff: 145.852 } },
  { offerId: '1588416', group: 'f7',  form: 'денна',        title: 'Компʼютерна інженерія', seatsMax: 170, sortOrder: 40, prev2025: { apps: 802, cutoff: 146 } },
  { offerId: '1630258', group: 'f2',  form: 'дистанційна',  title: 'Інженерія програмного забезпечення', seatsMax: 0, sortOrder: 50 },
  // заочна: держобсяги 2026 з наказу (ЄДЕБО їх не віддає в order_budget)
  { offerId: '1586573', group: 'f2',  form: 'заочна',       title: 'Інженерія програмного забезпечення', seatsMax: 14, sortOrder: 60 },
  { offerId: '1600953', group: 'f2i', form: 'дистанційна',  title: 'Програмування компʼютерних ігор', seatsMax: 0, sortOrder: 70 },
  { offerId: '1671590', group: 'f2i', form: 'заочна',       title: 'Програмування компʼютерних ігор', seatsMax: 5, sortOrder: 80 },
  { offerId: '1601038', group: 'f6',  form: 'дистанційна',  title: 'Інформаційні системи та технології', seatsMax: 0, sortOrder: 90 },
  { offerId: '1613137', group: 'f6',  form: 'заочна',       title: 'Інформаційні системи та технології', seatsMax: 14, sortOrder: 100 },
  { offerId: '1600952', group: 'f7',  form: 'дистанційна',  title: 'Компʼютерна інженерія', seatsMax: 0, sortOrder: 110 },
  { offerId: '1588884', group: 'f7',  form: 'заочна',       title: 'Компʼютерна інженерія', seatsMax: 13, sortOrder: 120 },
];

const uri = process.env.MONGO_URI;
if (!uri) { console.error('MONGO_URI не задано'); process.exit(1); }
const conn = await mongoose.createConnection(uri).asPromise();
for (const o of OFFERS) {
  await conn.collection('offers').updateOne(
    { offerId: o.offerId },
    { $set: { ...o, enabled: true } },
    { upsert: true },
  );
}
console.log(`засіяно ${OFFERS.length} оферів`);
await conn.close();

