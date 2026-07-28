const puppeteer = require('puppeteer-core');
async function getLink() {
  const browser = await puppeteer.launch({executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true});
  const page = await browser.newPage();
  await page.goto('https://vstup.edbo.gov.ua/offers/?qualification=1&education-base=40&speciality=121&region=80&institution=174', {waitUntil: 'networkidle0'});
  const href = await page.evaluate(() => document.querySelector('a[href^="/offer/"]').href);
  await browser.close();
  return href;
}
(async () => {
  const l1 = await getLink();
  const l2 = await getLink();
  console.log('Link 1:', l1);
  console.log('Link 2:', l2);
  console.log('Same?', l1 === l2);
})().catch(console.error);
