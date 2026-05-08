import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildScreenshotIngestionPreview,
  normalizeScorecardPlayers,
} from '../src/lib/scorecardIngestion.js';

const sheetValues = [
  ['', '', '', '1', '', '', '', '', '2'],
  ['18Birdies Name', 'Spreadsheet Name', 'Total Pts', 'Score ', 'Hdcp', 'Net', 'Birdies', 'Pts (4)', 'Score ', 'Hdcp', 'Net', 'Birdies', 'Pts (4)'],
  ['Charles M.', 'Chuck', '0'],
  ['Chad S.', 'Chad', '0'],
  ['Nick C.', 'Carp', '0'],
  ['Glen M.', 'Glen', '0'],
  [],
  ['Sean H.', 'Sean', '0'],
  ['Jake T.', 'Jake', '0'],
  ['James S.', 'Jimmy', '0'],
  ['Jon F.', 'Faro', '0'],
  [],
  ['Joe F.', 'Joey', '0'],
  ['Jim B.', 'Basar', '0'],
  ['Richard B.', 'Baker', '0'],
  ['Joe A.', 'Andulics', '0'],
];

test('normalizeScorecardPlayers accepts 18Birdies CH/gross/net fields', () => {
  assert.deepEqual(normalizeScorecardPlayers([
    { displayName: 'Richard B.', gross: 47, CH: 4, net: 43 },
  ]), [{ player: 'Richard B.', rawScore: 47, handicap: 4, netScore: 43 }]);
});

test('buildScreenshotIngestionPreview maps real two-player week 1 screenshot example', () => {
  const preview = buildScreenshotIngestionPreview({
    sheetValues,
    weekNumber: 1,
    groupName: 'group3',
    roster: ['Joey', 'Basar', 'Baker', 'Andulics'],
    extractedPlayers: [
      { displayName: 'Richard B.', gross: 47, CH: 4, net: 43 },
      { displayName: 'Joe A.', gross: 50, CH: 10, net: 40 },
    ],
    defaultBirdies: 0,
  });

  assert.deepEqual(preview.columns, { score: 'D', handicap: 'E', net: 'F', birdies: 'G', points: 'H' });
  assert.deepEqual(preview.rows[2].cells, { score: 'D15', handicap: 'E15', net: 'F15', birdies: 'G15', points: 'H15' });
  assert.deepEqual(preview.rows[2].values, { score: 47, handicap: 4, net: 43, birdies: 0, points: 2 });
  assert.deepEqual(preview.rows[3].cells, { score: 'D16', handicap: 'E16', net: 'F16', birdies: 'G16', points: 'H16' });
  assert.deepEqual(preview.rows[3].values, { score: 50, handicap: 10, net: 40, birdies: 0, points: 4 });
});
