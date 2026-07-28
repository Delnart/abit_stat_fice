const fetch = require('node-fetch');
const cheerio = require('cheerio');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
fetch('https://abit-poisk.org.ua/rate2026/direction/1586544').then(r=>r.text()).then(t=> {
  const $ = cheerio.load(t);
  console.log('Text:', $('.direction-details').text().trim().substring(0, 500));
  console.log('HTML:', $('.direction-details').html());
}).catch(console.error);
