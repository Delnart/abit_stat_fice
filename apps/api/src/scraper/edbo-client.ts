import { Injectable, Logger } from '@nestjs/common';
import fetch from 'node-fetch';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

@Injectable()
export class EdboClient {
  private readonly log = new Logger(EdboClient.name);
  private readonly base = 'https://abit-poisk.org.ua/rate2026/direction';
  private readonly backoff = [1000, 3000];

  /** Повертає масив HTML сторінок для заданого offerId */
  async fetchOffer(offerId: string): Promise<string[]> {
    const pages: string[] = [];
    let page = 1;
    
    while (true) {
      const url = `${this.base}/${offerId}?page=${page}`;
      let lastErr: unknown;
      let success = false;
      let html = '';

      for (let attempt = 0; attempt <= this.backoff.length; attempt++) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 15_000);
          
          try {
            const res = await fetch(url, {
              headers: { 
                'User-Agent': UA,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              },
              signal: controller.signal,
              redirect: 'follow',
            });
            clearTimeout(timeout);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            html = await res.text();
            success = true;
            break;
          } catch (e) {
            clearTimeout(timeout);
            throw e;
          }
        } catch (e) {
          lastErr = e;
          if (attempt < this.backoff.length) {
            this.log.warn(`offer ${offerId} page ${page}: спроба ${attempt + 1} впала (${e}), ретрай…`);
            await sleep(this.backoff[attempt]);
          }
        }
      }

      if (!success) {
        throw new Error(`offer ${offerId} page ${page}: усі спроби вичерпано — ${lastErr}`);
      }

      // Перевіряємо, чи є на сторінці заявки. Якщо ні — ми дійшли до кінця.
      if (!html.includes('application-status application-status-')) {
        break;
      }
      
      pages.push(html);
      
      // Якщо на сторінці менше 200 заявок, значить це остання сторінка
      const matchCount = (html.match(/application-status application-status-/g) || []).length;
      if (matchCount < 200) {
        break;
      }
      
      page++;
      await sleep(500); // невелика пауза між сторінками
    }
    
    return pages;
  }
}
