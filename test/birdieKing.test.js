import assert from 'node:assert/strict';
import test from 'node:test';

import { calculateBirdieKing, findBirdieColumns } from '../src/lib/birdieKing.js';

test('findBirdieColumns detects regular, major, and championship birdie columns', () => {
  assert.deepEqual(findBirdieColumns(['Score', 'Hdcp', 'Net', 'Birdies', 'Pts', 'Rd1', 'B', 'Final']), [3, 6]);
});

test('calculateBirdieKing totals Raw birdies and keeps tied leaders', () => {
  const rawValues = [
    ['', '', '', '1', '', '', '', '', '2', '', '', '', '', '3'],
    ['18Birdies Name', 'Spreadsheet Name', 'Total Pts', 'Score', 'Hdcp', 'Net', 'Birdies', 'Pts', 'Score', 'Hdcp', 'Net', 'Birdies', 'Pts', 'Score', 'Hdcp', 'Net', 'Birdies', 'Pts'],
    ['Tony A.', 'Tony', '4.5', '', '', '', '0', '0', '42', '16', '34', '1', '4', '45', '13', '38', '1', '0.5'],
    ['Ian O.', 'Ian', '2', '', '', '', '0', '0', '53', '25', '40', '0', '0', '46', '22', '35', '2', '2'],
    ['Jared F.', 'Jared', '6', '', '', '', '0', '0', '43', '16', '35', '0', '2', '41', '13', '34', '1', '4'],
  ];

  const stats = calculateBirdieKing(rawValues);

  assert.equal(stats.totalBirdies, 5);
  assert.equal(stats.maxBirdies, 2);
  assert.deepEqual(stats.leaders, ['Tony', 'Ian']);
  assert.equal(stats.leaderLabel, 'Tony & Ian');
});
