import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import test from 'node:test';
import handler, { clearSheetCsvCache } from '../netlify/functions/sheet-csv.js';

const originalFetch = globalThis.fetch;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  clearSheetCsvCache();
});

test('sheet CSV proxy serves only allowlisted tabs', async () => {
  globalThis.fetch = async () => new Response('Player,Score\nChad,72', {
    status: 200,
    headers: { 'Content-Type': 'text/csv' },
  });

  const response = await handler(new Request('https://example.com/api/sheets/leaderboard'));
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/csv/);
  assert.match(response.headers.get('cache-control'), /no-store/);
  assert.equal(await response.text(), 'Player,Score\nChad,72');
});

test('sheet CSV proxy uses live Sheets API when credentials are configured', async () => {
  const originalJson = process.env.AWL_GOOGLE_SERVICE_ACCOUNT_JSON;
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  process.env.AWL_GOOGLE_SERVICE_ACCOUNT_JSON = JSON.stringify({
    client_email: 'service@example.com',
    private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }),
  });

  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    if (String(url).includes('oauth2.googleapis.com')) {
      return new Response(JSON.stringify({ access_token: 'token' }), { status: 200 });
    }
    return new Response(JSON.stringify({ values: [['A', 'B'], ['Jimmy & Baker', '4']] }), { status: 200 });
  };

  try {
    const response = await handler(new Request('https://example.com/api/sheets/leaderboard'));
    assert.equal(response.status, 200);
    assert.equal(await response.text(), 'A,B\nJimmy & Baker,4');
    assert.equal(calls.some((url) => url.includes('spreadsheets/')), true);
  } finally {
    if (originalJson === undefined) delete process.env.AWL_GOOGLE_SERVICE_ACCOUNT_JSON;
    else process.env.AWL_GOOGLE_SERVICE_ACCOUNT_JSON = originalJson;
  }
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

test('sheet CSV proxy reuses a fresh response without another upstream request', async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response('Player,Score\nChad,35', { status: 200 });
  };

  const first = await handler(new Request('https://example.com/api/sheets/stats'));
  const second = await handler(new Request('https://example.com/api/sheets/stats'));

  assert.equal(await first.text(), 'Player,Score\nChad,35');
  assert.equal(await second.text(), 'Player,Score\nChad,35');
  assert.equal(first.headers.get('x-awl-cache'), 'MISS');
  assert.equal(second.headers.get('x-awl-cache'), 'HIT');
  assert.equal(calls, 1);
});
