import { parseOfferHtml } from './src/scraper/edbo-parser';

async function run() {
  const url = 'https://vstup.edbo.gov.ua/offer/1586544?_='+Date.now();
  console.log('Fetching', url);
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  try {
    const { meta, requests } = parseOfferHtml(html);
    console.log(`Successfully parsed! Total requests: ${requests.length}`);
  } catch (e: any) {
    console.error('ParseError:', e.message);
  }
}
run();
