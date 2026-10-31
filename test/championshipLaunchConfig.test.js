import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Netlify production defaults to regular mode without globally enabling Championship', async () => {
  const config = await readFile(new URL('../netlify.toml', import.meta.url), 'utf8');

  assert.match(config, /\[context\.production\.environment\][\s\S]*?VITE_CHAMPIONSHIP_MODE\s*=\s*"false"/);

  const globalBuildEnvironment = config.match(/\[build\.environment\]([\s\S]*?)(?=\n\[|$)/)?.[1] ?? '';
  assert.doesNotMatch(globalBuildEnvironment, /VITE_CHAMPIONSHIP_MODE/);
});

test('no Netlify context silently enables Championship Mode', async () => {
  const config = await readFile(new URL('../netlify.toml', import.meta.url), 'utf8');
  assert.doesNotMatch(config, /^\s*VITE_CHAMPIONSHIP_MODE\s*=\s*"true"/m);
});
