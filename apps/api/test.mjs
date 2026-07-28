import fs from 'fs';

async function fetchOffer() {
  const url = 'https://vstup.edbo.gov.ua/offer/1586544?_='+Date.now();
  console.log('Fetching', url);
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  
  const chunks = [];
  const re = /self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/gs;
  let m;
  while ((m = re.exec(html)) !== null) {
    try { chunks.push(JSON.parse('"' + m[1] + '"')); } catch (e) {}
  }
  const text = chunks.join('');
  
  const anchor = text.indexOf('"requests":[');
  if (anchor < 0) { console.log('No requests array found'); return; }
  
  const start = anchor + '"requests":'.length;
  let depth = 0;
  let inStr = false;
  let end = -1;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (c === '\\') i++;
      else if (c === '"') inStr = false;
    } else if (c === '"') inStr = true;
    else if (c === '[' || c === '{') depth++;
    else if (c === ']' || c === '}') {
      depth--;
      if (depth === 0) { end = i + 1; break; }
    }
  }
  
  if (end === -1) { console.log('Unbalanced JSON'); return; }
  
  const rawList = JSON.parse(text.slice(start, end));
  console.log(`Parsed ${rawList.length} requests from JSON.`);
  
  const withoutKV = rawList.filter(r => typeof r.konkurs_value !== 'number');
  console.log(`Requests without valid konkurs_value: ${withoutKV.length}`);
  if (withoutKV.length > 0) {
    console.log('Example:', withoutKV[0]);
  }
  
  const withoutStatus = rawList.filter(r => r.person_request_status_id == null);
  console.log(`Requests without status: ${withoutStatus.length}`);
}
fetchOffer().catch(console.error);
