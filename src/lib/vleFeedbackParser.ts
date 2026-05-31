import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';
import type { FeedbackCriterion, FeedbackItem } from '../types';

export interface ParsedFeedbackList {
  items: FeedbackItem[];
  pageUrls: string[];
}

const cleanText = (value: string) => value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();

const toAbsoluteUrl = (href: string | undefined, baseUrl: string) => {
  if (!href) return '';
  return new URL(href, baseUrl).toString();
};

const stableIdFromUrl = (url: string, fallback: string) => {
  const match = url.match(/\/emark\/mark\/(\d+)/);
  return match?.[1] ? `feedback-${match[1]}` : fallback;
};

const parseNumber = (value: string) => {
  const match = value.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : undefined;
};

function tableHeaders($: cheerio.CheerioAPI, table: Element) {
  return $(table)
    .find('tr')
    .first()
    .find('th, td')
    .map((_, cell) => cleanText($(cell).text()))
    .get();
}

function tableRows($: cheerio.CheerioAPI, table: Element) {
  return $(table)
    .find('tr')
    .slice(1)
    .map((_, row) => $(row).find('td, th').toArray())
    .get();
}

export function parseFeedbackList(html: string, pageUrl: string, baseUrl: string): ParsedFeedbackList {
  const $ = cheerio.load(html);
  const items: FeedbackItem[] = [];
  const seenItems = new Set<string>();

  $('table').each((_, table) => {
    const headers = tableHeaders($, table);
    const looksLikeFeedbackTable =
      headers.includes('Semester') &&
      headers.includes('Level') &&
      headers.includes('Module') &&
      headers.includes('Assessment') &&
      headers.includes('Feedback');

    if (!looksLikeFeedbackTable) return;

    $(table)
      .find('tr')
      .slice(1)
      .each((rowIndex, row) => {
        const cells = $(row).find('td').toArray();
        if (cells.length < 5) return;

        const url = toAbsoluteUrl($(cells[4]).find('a[href]').attr('href'), baseUrl);
        if (!url || seenItems.has(url)) return;
        seenItems.add(url);

        items.push({
          id: stableIdFromUrl(url, `feedback-${items.length + rowIndex}`),
          semester: cleanText($(cells[0]).text()),
          level: cleanText($(cells[1]).text()),
          module: cleanText($(cells[2]).text()),
          assessment: cleanText($(cells[3]).text()),
          url,
          provisional: true
        });
      });
  });

  const pageUrls = new Set<string>();
  $('a[href*="page="]').each((_, link) => {
    const href = toAbsoluteUrl($(link).attr('href'), pageUrl);
    if (href.includes('/feedback') || href.includes('/user/')) {
      pageUrls.add(href);
    }
  });

  return { items, pageUrls: [...pageUrls] };
}

export function parseFeedbackDetail(html: string, detailUrl: string, baseUrl: string): Partial<FeedbackItem> {
  const $ = cheerio.load(html);
  const bodyText = cleanText($('body').text());
  const detail: Partial<FeedbackItem> = {
    url: detailUrl,
    provisional: /provisional total/i.test(bodyText)
  };

  $('table').each((_, table) => {
    const headers = tableHeaders($, table);

    if (headers.includes('Submitted work')) {
      const firstRow = tableRows($, table)[0];
      const link = firstRow ? $(firstRow).find('a[href]').first() : undefined;
      const submittedUrl = link ? toAbsoluteUrl(link.attr('href'), baseUrl) : '';
      const title = link ? cleanText(link.text()) : '';
      if (title && submittedUrl) {
        detail.submittedWork = { title, url: submittedUrl };
      }
    }

    const looksLikeCriteriaTable =
      headers.includes('Criteria') &&
      headers.includes('Comment') &&
      headers.includes('Score');

    if (!looksLikeCriteriaTable) return;

    const criteria: FeedbackCriterion[] = [];
    $(table)
      .find('tr')
      .slice(1)
      .each((rowIndex, row) => {
        const cells = $(row).find('td, th').toArray();
        const firstCell = cleanText($(cells[0]).text());
        if (!firstCell) return;

        if (/provisional total/i.test(firstCell)) {
          const totalScore = parseNumber(cells.map(cell => cleanText($(cell).text())).join(' '));
          if (typeof totalScore === 'number') {
            detail.totalScore = totalScore;
          }
          return;
        }

        if (cells.length < 3) return;

        const scoreText = cleanText($(cells[2]).text());
        const maxText = cleanText($(cells[3]).text() || scoreText);
        const score = parseNumber(scoreText);
        const maxScore = parseNumber(maxText);
        if (typeof score !== 'number' || typeof maxScore !== 'number') return;

        criteria.push({
          id: `${stableIdFromUrl(detailUrl, 'feedback')}-criterion-${rowIndex}`,
          title: firstCell,
          comment: cleanText($(cells[1]).text()),
          score,
          maxScore
        });
      });

    if (criteria.length > 0) {
      detail.criteria = criteria;
    }
  });

  return detail;
}
