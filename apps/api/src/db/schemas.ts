import { Schema } from 'mongoose';

// offers — конфіг і метадані (upsert при кожному парсі; title/seats можна правити руками)
export const OfferSchema = new Schema(
  {
    offerId: { type: String, required: true, unique: true },
    title: String,
    code: String,
    specialityName: String,
    universityName: String,
    group: String,                       // ключ фільтра: f2 / f2i / f6 / f7
    form: String,                        // денна / заочна / дистанційна
    prev2025: Schema.Types.Mixed,        // { apps, cutoff } — минулорічна довідка
    seatsMax: { type: Number, default: 0 },
    seatsQ1: { type: Number, default: 0 },
    seatsQ2: { type: Number, default: 0 },
    orderContract: { type: Number, default: null },
    orderLicense: { type: Number, default: null },
    enabled: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// applicants_latest — останній сирий список по оферу (перезапис, не історія)
export const ApplicantsLatestSchema = new Schema({
  offerId: { type: String, required: true, unique: true },
  fetchedAt: { type: Date, required: true },
  requests: { type: [Schema.Types.Mixed], default: [] },
});

// snapshots — історія тільки розрахованих метрик (для графіків динаміки)
const Cat = { seats: Number, passed: Number, cutoff: { type: Number, default: null } };
export const SnapshotSchema = new Schema({
  offerId: { type: String, required: true },
  ts: { type: Date, required: true },
  total: Number,
  budgetClaims: Number,
  contractOnly: Number,
  forecast: Boolean,
  q1: Cat,
  q2: Cat,
  general: Cat,
  parseOk: { type: Boolean, default: true },
});
SnapshotSchema.index({ offerId: 1, ts: -1 });
