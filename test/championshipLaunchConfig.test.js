import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Netlify keeps Championship Mode off in production for the off-season', async () => {
  const config = await readFile(new URL('../netlify.toml', import.meta.url), 'utf8');

  assert.match(config, /\[context\.production\.environment\][\s\S]*?VITE_CHAMPIONSHIP_MODE\s*=\s*"false"/);
  assert.doesNotMatch(config, /VITE_CHAMPIONSHIP_MODE\s*=\s*"true"/);

  const globalBuildEnvironment = config.match(/\[build\.environment\]([\s\S]*?)(?=\n\[|$)/)?.[1] ?? '';
  assert.doesNotMatch(globalBuildEnvironment, /VITE_CHAMPIONSHIP_MODE/);
});
