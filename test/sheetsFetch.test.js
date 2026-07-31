import assert from 'node:assert/strict';
import test from 'node:test';

import { fetchTextWithRetry } from '../src/data/sheets.js';

test('fetchTextWithRetry stops immediately when the caller aborts', async () => {
  const originalFetch = globalThis.fetch;
  const controller = new AbortController();
  let calls = 0;
  globalThis.fetch = async (_url, { signal }) => {
    calls += 1;
    return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true }));
  };

  try {
    const request = fetchTextWithRetry('https://example.com/data.csv', { signal: controller.signal });
    controller.abort();
    await assert.rejects(request, { name: 'AbortError' });
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
