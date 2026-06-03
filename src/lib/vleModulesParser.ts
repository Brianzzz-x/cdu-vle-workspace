import * as cheerio from 'cheerio';
import type { Attachment, AttachmentType, Course, VleContentType, VlePost } from '../types';

export interface ParsedModulePage {
  posts: VlePost[];
  pageUrls: string[];
}

const cleanText = (value: string) => value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();

const toAbsoluteUrl = (href: string | undefined, baseUrl: string) => {
  if (!href) return '';
  return new URL(href, baseUrl).toString();
};

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const inferAttachmentType = (url: string, title: string): AttachmentType => {
  const source = `${url} ${title}`.toLowerCase();
  if (source.match(/\.pdf(\?|$|\s)/)) return 'pdf';
  if (source.match(/\.(doc|docx)(\?|$|\s)/)) return 'doc';
  if (source.match(/\.(xls|xlsx)(\?|$|\s)/)) return 'spreadsheet';
  if (source.match(/\.csv(\?|$|\s)/)) return 'csv';
  if (source.match(/\.(mp4|mov|webm)(\?|$|\s)/)) return 'video';
  if (source.match(/\.(zip|rar|7z)(\?|$|\s)/)) return 'archive';
  return 'other';
};

const parseWeek = (title: string) => {
  const match = title.match(/\bweek\s+(\d+)\b/i);
  return match ? Number(match[1]) : undefined;
};

const parseCourseLabel = (label: string, url: string): Pick<Course, 'id' | 'code' | 'name' | 'academicYear' | 'level'> => {
  const academicYear = url.match(/\/(\d{4}-\d{2})\//)?.[1] || '2025-26';
  const levelNumber = url.match(/\/year-(\d+)\//)?.[1];
  const level = levelNumber ? `Year ${levelNumber}` : 'Current';
  const parentheticalCode = label.match(/\(([^)]+)\)/)?.[1];
  const prefixCode = label.match(/^([A-Z]{3,}\d+[A-Z0-9]*)\s+-\s+/)?.[1];
  const code = parentheticalCode || prefixCode || (label.includes('Announcements') ? 'ANN' : label.split(/\s+/)[0]);
  const name = cleanText(label.replace(/\([^)]+\)/g, '').replace(/^([A-Z]{3,}\d+[A-Z0-9]*)\s+-\s+/, ''));

  return {
    id: slug(code || name),
    code,
    name,
    academicYear,
    level
  };
};

export function parseCurrentModules(html: string, baseUrl: string): Course[] {
  const $ = cheerio.load(html);
  const seen = new Set<string>();
  const courses: Course[] = [];

  $('a[href*="/2025-26/year-"]').each((_, link) => {
    const label = cleanText($(link).text());
    const url = toAbsoluteUrl($(link).attr('href'), baseUrl);
    if (!label || !url || seen.has(url)) return;
    if (!/CSCU|MATU|SPSU|Announcements|Database|Statistics|Data/i.test(label)) return;
    seen.add(url);

    const parsed = parseCourseLabel(label, url);
    courses.push({
      ...parsed,
      current: true,
      color: 'emerald',
      url
    });
  });

  return courses;
}

export function parseModulePage(html: string, courseId: string, baseUrl: string): ParsedModulePage {
  const $ = cheerio.load(html);
  const posts: VlePost[] = [];
  const seenPosts = new Set<string>();

  $('.views-row').each((_, row) => {
    const $row = $(row);
    const node = $row.find('.node').first();
    const container = node.length ? node : $row;
    const className = container.attr('class') || '';
    const titleLink = container.find('a[href*="/resource/"], a[href*="/quiz/"], a[href*="/announcement/"]').first();
    const title = cleanText(titleLink.text());
    const url = toAbsoluteUrl(titleLink.attr('href'), baseUrl);
    if (!title || !url || seenPosts.has(url)) return;
    seenPosts.add(url);

    const type: VleContentType = className.includes('node-quiz') || url.includes('/quiz/')
      ? 'quiz'
      : className.includes('node-announcement') || url.includes('/announcement/')
        ? 'announcement'
        : 'resource';

    const text = cleanText(container.text());
    const submitted = text.match(/Submitted by\s+(.+?)\s+on\s+(.+?)(?=\s+(Dear|The|This|In|We|Welcome|Please|Start Quiz|$))/i);
    const author = submitted?.[1] ? cleanText(submitted[1]) : 'VLE';
    const submittedAt = submitted?.[2] ? cleanText(submitted[2]) : '';
    const body = cleanText(
      text
        .replace(title, '')
        .replace(/Submitted by\s+.+?\s+on\s+.+?(?=\s+(Dear|The|This|In|We|Welcome|Please|Start Quiz|$))/i, '')
    );

    const attachments: Attachment[] = [];
    container.find('a[href*="/system/files/"]').each((attachmentIndex, attachmentLink) => {
      const attachmentTitle = cleanText($(attachmentLink).text());
      const attachmentUrl = toAbsoluteUrl($(attachmentLink).attr('href'), baseUrl);
      if (!attachmentTitle || !attachmentUrl) return;
      attachments.push({
        id: `${slug(url)}-file-${attachmentIndex}`,
        postId: slug(url),
        title: attachmentTitle,
        type: inferAttachmentType(attachmentUrl, attachmentTitle),
        url: attachmentUrl,
        status: 'unread',
        isBookmarked: false,
        progress: 0
      });
    });

    const startQuiz = container.find('a[href*="/take"]').first();
    const postId = slug(url);
    attachments.forEach(attachment => {
      attachment.postId = postId;
    });

    posts.push({
      id: postId,
      courseId,
      type,
      title,
      author,
      submittedAt,
      body,
      url,
      week: parseWeek(title),
      attachments,
      quizMeta: type === 'quiz' ? {
        questions: 0,
        attemptsAllowed: 'Open in VLE',
        available: 'See VLE',
        passRate: 'See VLE',
        backwardsNavigation: 'See VLE',
        startUrl: toAbsoluteUrl(startQuiz.attr('href'), baseUrl) || url
      } : undefined
    });
  });

  const pageUrls = new Set<string>();
  $('a[href*="page="]').each((_, link) => {
    const href = toAbsoluteUrl($(link).attr('href'), baseUrl);
    if (href) pageUrls.add(href);
  });

  return { posts, pageUrls: [...pageUrls] };
}
