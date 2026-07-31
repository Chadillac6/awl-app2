import test from 'node:test';
import assert from 'node:assert/strict';
import { parseOptInBoolean } from '../src/lib/cliArgs.js';

test('parseOptInBoolean keeps optional safeguards off by default', () => {
  assert.equal(parseOptInBoolean(undefined), false);
  assert.equal(parseOptInBoolean(false), false);
  assert.equal(parseOptInBoolean('no'), false);
  assert.equal(parseOptInBoolean('0'), false);
});

test('parseOptInBoolean accepts bare and common explicit true values', () => {
  assert.equal(parseOptInBoolean(true), true);
  assert.equal(parseOptInBoolean('TRUE'), true);
  assert.equal(parseOptInBoolean('yes'), true);
  assert.equal(parseOptInBoolean('1'), true);
});

test('parseOptInBoolean rejects ambiguous values instead of silently disabling a safeguard', () => {
  assert.throws(() => parseOptInBoolean('sometimes', 'require-tie-confirmation'), /must be true\/false/);
});
