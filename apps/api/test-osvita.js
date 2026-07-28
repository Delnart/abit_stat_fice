const fs = require('fs');
const html = fs.readFileSync('../../osvita.html', 'utf8');
const cheerio = require('cheerio'); // assuming cheerio is installed in apps/api or I can use basic string ops
try {
  const $ = cheerio.load(html);
  const pages = $('.pages-list a');
  console.log(`Pages: ${pages.length}`);
  if (pages.length > 0) {
    console.log($(pages[pages.length - 1]).attr('href'));
    console.log($(pages[pages.length - 1]).text());
  }
} catch (e) {
  console.error(e);
}
