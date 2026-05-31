import assert from 'node:assert/strict';
import test from 'node:test';
import { parseFeedbackDetail, parseFeedbackList } from './vleFeedbackParser';

test('parses feedback list rows and pagination links', () => {
  const html = `
    <table>
      <tr><th>Semester</th><th>Level</th><th>Module</th><th>Assessment</th><th>Feedback</th></tr>
      <tr>
        <td>Autumn 2025</td><td>2</td><td>Understanding Global Sport</td>
        <td>1000 Word Essay</td><td><a href="/emark/mark/105234">View</a></td>
      </tr>
    </table>
    <a href="/user/2301/feedback?page=1">next</a>
  `;

  const parsed = parseFeedbackList(html, 'https://vle.zycdu.net/user/2301/feedback', 'https://vle.zycdu.net');

  assert.equal(parsed.items.length, 1);
  assert.equal(parsed.items[0].id, 'feedback-105234');
  assert.equal(parsed.items[0].assessment, '1000 Word Essay');
  assert.equal(parsed.items[0].url, 'https://vle.zycdu.net/emark/mark/105234');
  assert.deepEqual(parsed.pageUrls, ['https://vle.zycdu.net/user/2301/feedback?page=1']);
});

test('parses feedback detail score, submitted work, and criteria', () => {
  const html = `
    <table>
      <tr><th>Submitted work</th></tr>
      <tr><td><a href="/emark/submittedwork/105234/file.doc">Essay.doc</a></td></tr>
    </table>
    <table>
      <tr><th>Criteria</th><th>Comment</th><th>Score</th></tr>
      <tr><td>Analysis</td><td>Feedback text</td><td>14</td><td>/ 20</td></tr>
      <tr><td>Provisional total:</td><td>66</td><td>%</td></tr>
    </table>
  `;

  const parsed = parseFeedbackDetail(html, 'https://vle.zycdu.net/emark/mark/105234', 'https://vle.zycdu.net');

  assert.equal(parsed.totalScore, 66);
  assert.equal(parsed.provisional, true);
  assert.equal(parsed.submittedWork?.title, 'Essay.doc');
  assert.equal(parsed.criteria?.[0].score, 14);
  assert.equal(parsed.criteria?.[0].maxScore, 20);
});
