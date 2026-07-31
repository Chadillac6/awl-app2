import test from 'node:test';
import assert from 'node:assert/strict';

import { parseStatsCSV } from '../src/data/sheets.js';

const csv = [
  ['', '', '', '1', '', '', '', '', '2', '', '', '', '', 'MAJOR', '', '', '', ''],
  ['18Birdies Name', 'Spreadsheet Name', 'Total Pts', 'Score', 'Hdcp', 'Net', 'Birdies', 'Pts (4)', 'Score', 'Hdcp', 'Net', 'Birdies', 'Pts (4)', 'Rd1', 'Rd2', 'Total', 'Birdies', 'Pts (6)'],
  ['Sean H.', 'Sean', '7', '', '', '', '', '0', '42', '12', '36', '0', '4', '31', '32', '63', '1', '6'],
  ['Jake T.', 'Jake', '1.5', '', '', '', '', '0', '', '', '', '0', '0', '0', '0', '0', '0', '0'],
  ['James S.', 'Jimmy', '4.5', '', '', '', '', '0', '46', '14', '39', '0', '1.5', '35', '34', '69', '2', '4'],
  ['', '', '', 'Total Gross', 'Avg Gross', 'Total Net', 'Avg Net', 'Avg Pts', 'Avg Hdcp', 'Birdies', 'Missed Week'],
  ['', '', 'Sean', '84', '42', '72', '36', '4', '12', '1', '0'],
  ['', '', 'Jake', '47', '47', '39', '39', '1.5', '15', '0', '1'],
  ['All Time Records', '', '', '', '', '', '', '', '', '', ''],
  ['', '', '', 'Lowest Net', 'Sean', '36', '', '', '', '', ''],
].map((row) => row.join(',')).join('\n');

test('parseStatsCSV builds only scored week options and regular weekly score rows', () => {
  const result = parseStatsCSV(csv);

  assert.deepEqual(result.weekOptions.map(({ value, label, isMajor }) => ({ value, label, isMajor })), [
    { value: '2', label: 'Week 2', isMajor: false },
    { value: 'major', label: 'Seneca', isMajor: true },
  ]);

  assert.deepEqual(result.weeklyStatsByWeek['2'].players, [
    { player: 'Sean', gross: 42, hdcp: 12, net: 36, birdies: 0, points: 4 },
    { player: 'Jake', gross: 0, hdcp: 0, net: 0, birdies: 0, points: 0 },
    { player: 'Jimmy', gross: 46, hdcp: 14, net: 39, birdies: 0, points: 1.5 },
  ]);
});

test('parseStatsCSV maps Seneca to custom round columns', () => {
  const result = parseStatsCSV(csv);

  assert.deepEqual(result.weeklyStatsByWeek.major.players[0], {
    player: 'Sean',
    rd1: 31,
    rd2: 32,
    total: 63,
    birdies: 1,
    points: 6,
  });
});

test('parseStatsCSV keeps season stats including average points', () => {
  const result = parseStatsCSV(csv);

  assert.deepEqual(result.players.map(({ player, avgPts }) => ({ player, avgPts })), [
    { player: 'Sean', avgPts: 4 },
    { player: 'Jake', avgPts: 1.5 },
  ]);
  assert.deepEqual(result.lowestNetRecord, { player: 'Sean', score: 36 });
});

test('parseStatsCSV adds players tied for lowest gross from weekly score data', () => {
  const tieCsv = [
    ['', '', '', '1', '', '', '', '', '2', '', '', '', ''],
    ['18Birdies Name', 'Spreadsheet Name', 'Total Pts', 'Score', 'Hdcp', 'Net', 'Birdies', 'Pts (4)', 'Score', 'Hdcp', 'Net', 'Birdies', 'Pts (4)'],
    ['Joe F.', 'Joey', '4', '40', '8', '32', '0', '2', '39', '8', '31', '0', '2'],
    ['Josh H.', 'Josh', '4', '45', '9', '36', '0', '1', '36', '9', '27', '0', '4'],
    ['', '', '', 'Total Gross', 'Avg Gross', 'Total Net', 'Avg Net', 'Avg Pts', 'Avg Hdcp', 'Birdies', 'Missed Week'],
    ['', '', 'Joey', '79', '39.5', '63', '31.5', '2', '8', '0', '0'],
    ['', '', 'Josh', '81', '40.5', '63', '31.5', '2.5', '9', '0', '0'],
    ['All Time Records', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', 'Lowest Gross:', 'Joey', '36', '', '', '', '', ''],
  ].map((row) => row.join(',')).join('\n');

  const result = parseStatsCSV(tieCsv);

  assert.deepEqual(result.lowestGrossRecord, { player: 'Josh & Joey', score: 36 });
});
