import assert from 'node:assert/strict';
import test from 'node:test';
import handler from '../netlify/functions/sheet-csv.js';

const originalFetch = globalThis.fetch;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('sheet CSV proxy serves only allowlisted tabs', async () => {
  globalThis.fetch = async () => new Response('Player,Score\nChad,72', {
    status: 200,
    headers: { 'Content-Type': 'text/csv' },
  });

  const response = await handler(new Request('https://example.com/api/sheets/leaderboard'));
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/csv/);
  assert.match(response.headers.get('cache-control'), /max-age=15/);
  assert.equal(await response.text(), 'Player,Score\nChad,72');
});

test('sheet CSV proxy rejects unknown tabs without fetching upstream', async () => {
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return new Response('nope');
  };

  const response = await handler(new Request('https://example.com/api/sheets/private'));
  assert.equal(response.status, 404);
  assert.equal(called, false);
});

test('sheet CSV proxy converts upstream failures to a safe 502', async () => {
  globalThis.fetch = async () => new Response('Forbidden', { status: 403 });

  const response = await handler(new Request('https://example.com/api/sheets/schedule'));
  assert.equal(response.status, 502);
  assert.equal(await response.text(), 'Sheet data unavailable');
});
