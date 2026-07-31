import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';

import { buildSortRangeRequest, LEADERBOARD_GROUP_BLOCKS } from '../src/lib/leaderboardSort.js';
import { buildServiceAccountJwtAssertion, clearGoogleAccessTokenCache, getServiceAccountAccessToken } from '../src/lib/googleAuth.js';

test.afterEach(() => {
  clearGoogleAccessTokenCache();
});

test('all leaderboard groups have stable four-row sort blocks', () => {
  assert.deepEqual(LEADERBOARD_GROUP_BLOCKS, {
    group1: { label: 'Group A', startRow: 5, endRow: 8 },
    group2: { label: 'Group B', startRow: 10, endRow: 13 },
    group3: { label: 'Group C', startRow: 15, endRow: 18 },
    group4: { label: 'Group D', startRow: 20, endRow: 23 },
  });
});

test('all group sort requests sort whole A:Q rows by Total column D', () => {
  const requests = Object.values(LEADERBOARD_GROUP_BLOCKS).map((block) => buildSortRangeRequest({
    sheetId: 483982929,
    startRow: block.startRow,
    endRow: block.endRow,
  }));

  assert.equal(requests.length, 4);
  assert.deepEqual(requests.map((request) => request.sortRange.range), [
    { sheetId: 483982929, startRowIndex: 4, endRowIndex: 8, startColumnIndex: 0, endColumnIndex: 17 },
    { sheetId: 483982929, startRowIndex: 9, endRowIndex: 13, startColumnIndex: 0, endColumnIndex: 17 },
    { sheetId: 483982929, startRowIndex: 14, endRowIndex: 18, startColumnIndex: 0, endColumnIndex: 17 },
    { sheetId: 483982929, startRowIndex: 19, endRowIndex: 23, startColumnIndex: 0, endColumnIndex: 17 },
  ]);
  requests.forEach((request) => {
    assert.deepEqual(request.sortRange.sortSpecs, [
      { dimensionIndex: 3, sortOrder: 'DESCENDING' },
      { dimensionIndex: 1, sortOrder: 'ASCENDING' },
    ]);
  });
});

test('buildServiceAccountJwtAssertion creates a signed JWT structure', () => {
  const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
  });
  const assertion = buildServiceAccountJwtAssertion({
    clientEmail: 'awl@example.iam.gserviceaccount.com',
    privateKey,
    scope: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  assert.equal(assertion.split('.').length, 3);
  const [, payload] = assertion.split('.');
  const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  assert.equal(decoded.iss, 'awl@example.iam.gserviceaccount.com');
  assert.equal(decoded.scope, 'https://www.googleapis.com/auth/spreadsheets');
  assert.equal(decoded.aud, 'https://oauth2.googleapis.com/token');
});

test('service account access tokens are reused until near expiry', async () => {
  const originalFetch = globalThis.fetch;
  const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
  });
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response(JSON.stringify({ access_token: 'cached-token', expires_in: 3600 }), { status: 200 });
  };

  try {
    const options = { serviceAccountCredentials: { client_email: 'cache@example.com', private_key: privateKey } };
    assert.equal(await getServiceAccountAccessToken(options), 'cached-token');
    assert.equal(await getServiceAccountAccessToken(options), 'cached-token');
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
