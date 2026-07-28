const fetch = require('node-fetch');
const cheerio = require('cheerio');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
fetch('https://abit-poisk.org.ua/rate2026/direction/1586544').then(r=>r.text()).then(t=> {
  const $ = cheerio.load(t);
  const typeCol = $('td[data-header="Тип"]').first().text();
  console.log('Type col length:', $('td[data-header="Тип"]').length);
  console.log('Type column html:', $('td[data-header="Тип"]').first().html());
}).catch(console.error);
