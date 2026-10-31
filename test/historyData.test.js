import assert from 'node:assert/strict';
import test from 'node:test';

import { historicalData } from '../src/data/staticData.js';

test('2026 championship is the featured (first) entry', () => {
  const [latest, previous] = historicalData.championships;
  assert.equal(latest.year, 2026);
  assert.equal(previous.year, 2025);
});

test('2026 championship has the full 16-player leaderboard', () => {
  const { results } = historicalData.championships[0];
  assert.equal(results.length, 16);
  assert.deepEqual(results[0], { place: 1, name: 'Richie Baker', score: '+2' });
  assert.deepEqual(results.slice(1, 3).map(({ name, score }) => [name, score]), [['Josh Houser', '+6'], ['Sean Housel', '+7']]);
  assert.equal(results[2].note, 'Won putt-off');
  assert.equal(results.at(-1).score, 'DNP');
});
