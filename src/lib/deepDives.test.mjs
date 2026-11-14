import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { indexDeepDives, readDeepDive, searchDeepDives } from './deepDives.mjs';

const study = JSON.parse(readFileSync(new URL('../data/case-studies/case-al-ahli-20231017.json', import.meta.url)));
function readEntries(dir) {
  return readdirSync(dir).flatMap(name => {
    const path = dir + '/' + name;
    return statSync(path).isDirectory() ? readEntries(path) : name === 'examples.json' ? JSON.parse(readFileSync(path)) : [];
  });
}
test('the accepted study opens its intended chapter from each real timeline entry', () => {
  const index = indexDeepDives([study], readEntries('tweets'));
  assert.equal(index.size, 4);
  for (const { entryId, pageId } of study.timelineLinks) assert.deepEqual(index.get(entryId), [{study,pageId}]);
});
test('overview and chapter URLs resolve, including an obsolete chapter ID', () => {
  const params = new URLSearchParams({ deepDive:study.exampleId, chapter:study.pages[0].id });
  assert.equal(readDeepDive(params,[study]).pageId,study.pages[0].id);
  params.set('chapter','not-a-chapter');
  assert.equal(readDeepDive(params,[study]).pageId,null);
  params.set('deepDive','not-a-study');
  assert.equal(readDeepDive(params,[study]),null);
});
test('chapter evidence uses Tweet embeds, hosted screenshots, or source links, with only small tile images bundled', () => {
  assert.equal(study.pages.length, 8);
  assert.doesNotMatch(JSON.stringify(study), /"reviewFeedback"|"feedback"|localhost|127\.0\.0\.1/);
  const evidence = study.pages.flatMap(p => p.evidence);
  for (const item of evidence) {
    if (item.type === 'tweet') assert.match(item.tweetId, /^\d+$/);
    else if (item.id === 'image-1714686604189794524-0') {
      assert.equal(item.type, 'image');
      assert.equal(item.imageUrl, 'https://pbs.twimg.com/media/F8vKYNeagAI128H.jpg');
      assert.equal(item.url, 'https://x.com/yashar/status/1714686604189794524');
      assert.equal(item.tweetId, undefined);
    } else if (item.id === '045b1b14-2210-4f2d-9177-5bc9ce3b965d') {
      assert.equal(item.type, 'image');
      assert.equal(item.imageUrl, 'https://pbs.twimg.com/media/F8vYeH-XYAA-Kkc?format=jpg&name=medium');
      assert.equal(item.url, item.imageUrl);
    } else if (item.type === 'image') {
      assert.match(item.imageUrl, /^https:\/\/honestreporting\.com\/app\/uploads\//);
      assert.match(item.url, /^https:\/\/honestreporting\.com\/media-commits/);
    } else { assert.equal(item.type, 'link'); assert.match(item.url, /^https?:/); }
    for (const key of ['mediaUrl', 'snapshot']) assert.equal(item[key], undefined);
  }
  assert.deepEqual(evidence.filter(e => e.type === 'image').map(e => e.id).sort(), ['045b1b14-2210-4f2d-9177-5bc9ce3b965d', 'image-1714686604189794524-0', 'p1-abc-australia', 'p1-reuters']);
  for (const {coverUrl} of study.pages) {
    assert.ok(coverUrl);
    if (coverUrl.startsWith('case-study-thumbs/')) {
      assert.ok(existsSync('public/' + coverUrl));
      assert.ok(statSync('public/' + coverUrl).size < 60_000);
    } else assert.equal(new URL(coverUrl).searchParams.get('name'), 'small');
  }
});

test('deep dive search opens overviews and matching chapters without surfacing unrelated chapters', () => {
  const ids = (query, categories) => searchDeepDives([study], query, categories).map(result => result.pageId);
  assert.deepEqual(ids('  BAPTIST   hospital '), [null]);
  assert.deepEqual(ids('Al-Ahli misfiring Palestinian rocket'), ['al-ahli-page-6']);
  assert.deepEqual(ids('misfiring Palestinian rocket'), ['al-ahli-page-6']);
  assert.deepEqual(ids('misfiring Palestinian rocket', ['32']), ['al-ahli-page-6']);
  assert.deepEqual(ids('misfiring Palestinian rocket', ['unrelated']), []);
  assert.deepEqual(ids('  '), []);
});
