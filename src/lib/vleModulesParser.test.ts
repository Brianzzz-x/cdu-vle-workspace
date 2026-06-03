import assert from 'node:assert/strict';
import test from 'node:test';
import { parseCurrentModules, parseModulePage } from './vleModulesParser';

test('parses current module links from VLE navigation', () => {
  const html = `
    <a href="/2025-26/year-2/intro-data-science-cscu9s2">Intro to Data Science (CSCU9S2)</a>
    <a href="/2025-26/year-2/practical-statistics-matu9d2">Practical Statistics (MATU9D2)</a>
  `;

  const courses = parseCurrentModules(html, 'https://vle.zycdu.net');

  assert.equal(courses.length, 2);
  assert.equal(courses[0].id, 'cscu9s2');
  assert.equal(courses[0].code, 'CSCU9S2');
  assert.equal(courses[0].name, 'Intro to Data Science');
  assert.equal(courses[0].url, 'https://vle.zycdu.net/2025-26/year-2/intro-data-science-cscu9s2');
});

test('parses module posts, attachments, quiz start URL, and pagination', () => {
  const html = `
    <div class="views-row">
      <div class="node node-resource">
        <a href="/resource/2026-05/week-12">CSCU9S2 Week 12: Exam Review</a>
        Submitted by Zaid Hasan on Fri, 2026-05-29 12:45
        Dear students, final review.
        <a href="/system/files/resource/2026-05/review.pdf">Review.pdf</a>
        <a href="/system/files/resource/2026-05/data.csv">data.csv</a>
      </div>
    </div>
    <div class="views-row">
      <div class="node node-quiz">
        <a href="/quiz/15558/week-10-quiz">Week 10 Quiz</a>
        Submitted by Zaid Hasan on Thu, 2026-05-21 08:57
        <a href="/node/15558/take">Start Quiz</a>
      </div>
    </div>
    <a href="/2025-26/year-2/intro-data-science-cscu9s2?page=1">next</a>
  `;

  const parsed = parseModulePage(html, 'cscu9s2', 'https://vle.zycdu.net');

  assert.equal(parsed.posts.length, 2);
  assert.equal(parsed.posts[0].week, 12);
  assert.equal(parsed.posts[0].attachments[0].type, 'pdf');
  assert.equal(parsed.posts[0].attachments[1].type, 'csv');
  assert.equal(parsed.posts[1].type, 'quiz');
  assert.equal(parsed.posts[1].quizMeta?.startUrl, 'https://vle.zycdu.net/node/15558/take');
  assert.deepEqual(parsed.pageUrls, ['https://vle.zycdu.net/2025-26/year-2/intro-data-science-cscu9s2?page=1']);
});
