import { Injectable, Logger } from '@nestjs/common';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** GET /offer/{id} з ретраями: ~7–13 % запитів ЄДЕБО випадково падають з 500/502 */
@Injectable()
export class EdboClient {
  private readonly log = new Logger(EdboClient.name);
  private readonly base = process.env.EDBO_BASE_URL ?? 'https://vstup.edbo.gov.ua';
  private readonly backoff = [1000, 3000];

  async fetchOffer(offerId: string): Promise<string> {
    // унікальний query — обхід CDN-кешу ЄДЕБО (інакше прилітає застаріла копія сторінки)
    const url = `${this.base}/offer/${offerId}?_=${Date.now()}`;
    let lastErr: unknown;
    for (let attempt = 0; attempt <= this.backoff.length; attempt++) {
      try {
        const res = await fetch(url, {
          headers: { 
            'User-Agent': UA,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'sec-ch-ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'document',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-site': 'none',
            'sec-fetch-user': '?1',
            'upgrade-insecure-requests': '1'
          },
          signal: AbortSignal.timeout(15_000),
          redirect: 'follow',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.text();
      } catch (e) {
        lastErr = e;
        if (attempt < this.backoff.length) {
          this.log.warn(`offer ${offerId}: спроба ${attempt + 1} впала (${e}), ретрай…`);
          await sleep(this.backoff[attempt]);
        }
      }
    }
    throw new Error(`offer ${offerId}: усі спроби вичерпано — ${lastErr}`);
  }
}
