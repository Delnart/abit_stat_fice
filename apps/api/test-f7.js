const fetch = require('node-fetch');
const cheerio = require('cheerio');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
fetch('https://abit-poisk.org.ua/rate2026/direction/1588884').then(r=>r.text()).then(t=> {
  const $ = cheerio.load(t);
  console.log($('body').text().trim().replace(/\s+/g, ' ').substring(0, 1000));
}).catch(console.error);
