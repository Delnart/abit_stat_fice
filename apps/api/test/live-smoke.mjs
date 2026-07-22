// Разовий смоук проти живого ЄДЕБО (1 запит): node test/live-smoke.mjs [offerId]
// Не в тест-сюті — мережа/зовнішній стан. Ганяти руками при зміні формату.
const id = process.argv[2] ?? '1589232';
const { parseOfferHtml } = await import('../dist/scraper/edbo-parser.js');

const res = await fetch(`https://vstup.edbo.gov.ua/offer/${id}`, {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0' },
  signal: AbortSignal.timeout(15000),
});
console.log('HTTP', res.status);
const html = await res.text();
const { meta, requests } = parseOfferHtml(html);
console.log('офер:', meta.name);
console.log('заяв:', requests.length, '· бюджетних:', requests.filter(r => r.budget).length,
  '· статуси:', [...new Set(requests.map(r => r.statusId))].join(','));
