import * as cheerio from 'cheerio';

export class ParseError extends Error {}

export interface EdboSubject {
  name: string;
  coefficient: number;
  score: number;
}

export interface EdboRequest {
  id: number;
  statusId: number;
  score: number;
  priority: number | null;
  q1: boolean;
  q2: boolean;
  budget: boolean;
  original: boolean;
  subjects: EdboSubject[];
}

export interface EdboOfferMeta {
  name: string | null;
  specialityCode: string | null;
  specialityName: string | null;
  orderBudget: number | null;
  orderContract: number | null;
  orderLicense: number | null;
  universityName: string | null;
}

export interface ParsedOffer {
  meta: EdboOfferMeta;
  requests: EdboRequest[];
}

function parseNum(text: string | undefined): number | null {
  if (!text) return null;
  const match = text.replace(/,/g, '.').match(/[0-9.]+/);
  return match ? Number(match[0]) : null;
}

export function parseOfferHtml(htmlPages: string[]): ParsedOffer {
  if (!htmlPages || htmlPages.length === 0) {
    throw new ParseError('Не передано HTML сторінок для парсингу');
  }

  // Парсимо мету з першої сторінки
  const $first = cheerio.load(htmlPages[0]);
  
  // Приклад: <span class="search-rez">Інженерія програмного забезпечення інформаційних систем; Інженерія програмного забезпечення комп'ютерних систем.</span>
  let name = '';
  $first('.search-rez').each((_, el) => {
    name += $first(el).text().trim() + ' ';
  });
  
  let orderBudget = null;
  let orderLicense = null;
  let orderContract = null; // abit-poisk usually doesn't show contract seats separately unless in text

  const infoText = $first('.col-xl-9.col-lg-9.col-md-12').text() || $first('body').text();
  
  const licenseMatch = infoText.match(/Ліцензований обсяг прийому[:\s]*(\d+)/);
  if (licenseMatch) orderLicense = Number(licenseMatch[1]);
  
  const budgetMatch = infoText.match(/Максимальне держзамовлення[:\s]*(\d+)/);
  if (budgetMatch) orderBudget = Number(budgetMatch[1]);

  const meta: EdboOfferMeta = {
    name: name.trim() || null,
    specialityCode: null,
    specialityName: null,
    orderBudget,
    orderContract,
    orderLicense,
    universityName: null,
  };

  const requests: EdboRequest[] = [];
  const idSet = new Set<number>();

  for (const html of htmlPages) {
    const $ = cheerio.load(html);
    
    $('tr.application-status').each((_, el) => {
      const $el = $(el);
      
      const statusClass = $el.attr('class') || '';
      const statusMatch = statusClass.match(/application-status-(\d+)/);
      const statusId = statusMatch ? Number(statusMatch[1]) : 0;
      
      // ІД заявки можна дістати з посилання або просто автогенерувати, бо stats-calculator використовує його для passedIds. 
      // Але краще витягти з посилання: <a href="/#search-174-10274510...">
      let id = 0;
      const href = $el.find('a').attr('href');
      if (href) {
        const idMatch = href.match(/search-\d+-(\d+)/);
        if (idMatch) id = Number(idMatch[1]);
      }
      if (!id) id = Math.floor(Math.random() * 1000000000); // fallback
      
      if (idSet.has(id)) return; // duplicate check
      idSet.add(id);

      const scoreText = $el.find('td[data-header="Бал"]').text().trim();
      const score = parseNum(scoreText) ?? 0;
      
      const priorityHtml = $el.find('td[data-header="Пріоритет"]').text().trim();
      const priorityMatch = priorityHtml.match(/(\d+)/);
      const priority = priorityMatch ? Number(priorityMatch[1]) : null;
      
      const quotaText = $el.find('td[data-header="Квоти"]').text().trim().toUpperCase();
      const q1 = quotaText.includes('КВОТА-1');
      const q2 = quotaText.includes('КВОТА-2');
      
      const budget = priorityHtml.includes('(Б)'); // 'Б' means budget claim

      // ПВМ/ВЗ (оригінали)
      const pvmText = $el.find('td[data-html="true"]').attr('title') || '';
      const original = pvmText.includes('Виконано вимоги');

      requests.push({
        id,
        statusId,
        score,
        priority,
        q1,
        q2,
        budget,
        original,
        subjects: [] // abit-poisk HTML does not contain coefficients, so we leave it empty.
      });
    });
  }

  return { meta, requests };
}
