const fetch = require('node-fetch');
async function run() {
  const res = await fetch('https://vstup.edbo.gov.ua/offers/?qualification=1&education-base=40&speciality=121&region=80&institution=174');
  const text = await res.text();
  const buildIdMatch = text.match(/"buildId":"([^"]+)"/);
  if (!buildIdMatch) {
    console.log('Build ID not found');
    return;
  }
  const buildId = buildIdMatch[1];
  console.log('Build ID:', buildId);
  const dataRes = await fetch(`https://vstup.edbo.gov.ua/_next/data/${buildId}/offers.json?qualification=1&education-base=40&speciality=121&region=80&institution=174`);
  const data = await dataRes.json();
  console.log(JSON.stringify(data.pageProps.offers || data).substring(0, 1000));
}
run().catch(console.error);
