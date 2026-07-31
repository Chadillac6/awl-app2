import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Netlify enables Championship Mode only in the production deploy context', async () => {
  const config = await readFile(new URL('../netlify.toml', import.meta.url), 'utf8');

  assert.match(config, /\[context\.production\.environment\][\s\S]*?VITE_CHAMPIONSHIP_MODE\s*=\s*"true"/);

  const globalBuildEnvironment = config.match(/\[build\.environment\]([\s\S]*?)(?=\n\[|$)/)?.[1] ?? '';
  assert.doesNotMatch(globalBuildEnvironment, /VITE_CHAMPIONSHIP_MODE/);
});
