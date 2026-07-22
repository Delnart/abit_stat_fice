// Чистий парсер SSR-сторінки офера vstup.edbo.gov.ua (Next.js 15).
// Список заяв вбудований у чанки self.__next_f.push([1,"…"]) як екранований JSON.
// Ризик №1 проєкту: зміна формату __next_f — тому все за fail-fast принципом
// з ParseError і тестом на фікстурі fixtures/offer-*.html.

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

/** Дістає і розекранвує всі чанки __next_f у один flight-текст */
function flightText(html: string): string {
  const chunks: string[] = [];
  const re = /self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/gs;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      chunks.push(JSON.parse('"' + m[1] + '"'));
    } catch {
      // биті чанки пропускаємо — потрібний нам валідний, інакше впадемо нижче
    }
  }
  if (!chunks.length) throw new ParseError('__next_f чанків не знайдено — ЄДЕБО змінив розмітку?');
  return chunks.join('');
}

/** Сканує збалансований JSON-масив від позиції відкриваючої "[" (строки/escape враховано) */
function scanJsonArray(text: string, start: number): string {
  if (text[start] !== '[') throw new ParseError('очікував "[" на початку масиву requests');
  let depth = 0;
  let inStr = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (c === '\\') i++;
      else if (c === '"') inStr = false;
    } else if (c === '"') inStr = true;
    else if (c === '[' || c === '{') depth++;
    else if (c === ']' || c === '}') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  throw new ParseError('масив requests не збалансований — обірваний документ?');
}

function metaStr(text: string, key: string): string | null {
  const m = text.match(new RegExp(`"${key}":"((?:[^"\\\\]|\\\\.)*)"`));
  return m ? (JSON.parse('"' + m[1] + '"') as string) : null;
}
function metaNum(text: string, key: string): number | null {
  const m = text.match(new RegExp(`"${key}":(null|[0-9.]+)`));
  return m && m[1] !== 'null' ? Number(m[1]) : null;
}

export function parseOfferHtml(html: string): ParsedOffer {
  const text = flightText(html);

  const anchor = text.indexOf('"requests":[');
  if (anchor < 0) throw new ParseError('ключ "requests" не знайдено у flight-даних');
  const rawArr = scanJsonArray(text, anchor + '"requests":'.length);

  let rawList: any[];
  try {
    rawList = JSON.parse(rawArr);
  } catch (e) {
    throw new ParseError('requests не парситься як JSON: ' + (e as Error).message);
  }

  const requests: EdboRequest[] = rawList.map((r: any) => {
    if (typeof r.konkurs_value !== 'number' || r.person_request_status_id == null) {
      throw new ParseError('заява без konkurs_value/status — формат полів змінився');
    }
    return {
      id: r.person_request_id ?? 0,
      statusId: r.person_request_status_id,
      score: r.konkurs_value,
      priority: typeof r.priority === 'number' && r.priority > 0 ? r.priority : null,
      q1: r.q1 === 1,
      q2: r.q2 === 1,
      budget: r.is_claim_for_budget === 1,
      original: r.has_original_documents === 1,
      subjects: Array.isArray(r.subjects)
        ? r.subjects.map((s: any) => ({
            name: s?.speciality_offer_subject?.subject?.subject_name ?? '',
            coefficient: s?.speciality_offer_subject?.coefficient ?? 0,
            score: s?.main_score ?? 0,
          }))
        : [],
    };
  });

  const meta: EdboOfferMeta = {
    name: metaStr(text, 'university_specialities_name'),
    specialityCode: metaStr(text, 'speciality_code'),
    specialityName: metaStr(text, 'speciality_name'),
    orderBudget: metaNum(text, 'order_budget'),
    orderContract: metaNum(text, 'order_contract'),
    orderLicense: metaNum(text, 'order_license'),
    universityName: metaStr(text, 'university_name'),
  };

  return { meta, requests };
}
