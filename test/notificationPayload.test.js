import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeNotificationPayload } from '../src/lib/notificationPayload.js';

test('normalizeNotificationPayload preserves safe relative urls and trims text', () => {
  const payload = normalizeNotificationPayload({
    title: '  Weekly   update   ',
    body: 'All    scores are in.',
    url: '/leaderboard?week=1',
    tag: 'AWL weekly update!',
  });

  assert.deepEqual(payload, {
    title: 'Weekly update',
    body: 'All scores are in.',
    url: '/leaderboard?week=1',
    tag: 'AWL-weekly-update',
  });
});

test('normalizeNotificationPayload rejects unsafe urls and truncates long fields', () => {
  const payload = normalizeNotificationPayload({
    title: 'x'.repeat(80),
    body: 'y'.repeat(180),
    url: 'javascript:alert(1)',
    tag: 'z'.repeat(120),
  });

  assert.equal(payload.url, '/');
  assert.equal(payload.title.length, 64);
  assert.equal(payload.body.length, 140);
  assert.equal(payload.tag.length <= 64, true);
});
