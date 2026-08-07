import assert from 'node:assert/strict';
import test from 'node:test';
import { findModuleScriptSource, hasNewAppBundle } from '../src/lib/appFreshness.js';

test('findModuleScriptSource extracts the Vite entry bundle', () => {
  assert.equal(
    findModuleScriptSource('<script type="module" crossorigin src="/assets/index-new.js"></script>'),
    '/assets/index-new.js',
  );
});

test('hasNewAppBundle detects a changed production entry bundle', async () => {
  const fetchImpl = async () => ({
    ok: true,
    text: async () => '<script type="module" src="/assets/index-new.js"></script>',
  });

  assert.equal(await hasNewAppBundle({
    currentSource: '/assets/index-old.js',
    origin: 'https://amwalkingleague.netlify.app',
    fetchImpl,
  }), true);
  assert.equal(await hasNewAppBundle({
    currentSource: '/assets/index-new.js',
    origin: 'https://amwalkingleague.netlify.app',
    fetchImpl,
  }), false);
});
