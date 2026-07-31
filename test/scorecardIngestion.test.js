import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildExistingWeekScorecardPlayers,
  buildScreenshotIngestionPreview,
  mergeExistingAndExtractedScorecardPlayers,
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
  ]).map(({ player, rawScore, handicap, netScore }) => ({ player, rawScore, handicap, netScore })), [{ player: 'Richard B.', rawScore: 47, handicap: 4, netScore: 43 }]);
});

test('normalizeScorecardPlayers uses OCR row hints to preserve row order', () => {
  assert.deepEqual(normalizeScorecardPlayers([
    { displayName: 'Jake T.', gross: 42, CH: 15, net: 36, rowIndex: 2 },
    { displayName: 'Sean H.', gross: 47, CH: 12, net: 39, rowIndex: 1 },
  ]).map(({ player, netScore }) => ({ player, netScore })), [
    { player: 'Sean H.', netScore: 39 },
    { player: 'Jake T.', netScore: 36 },
  ]);
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

test('existing week scores merge with new scorecard rows so group points are recalculated', () => {
  const groupDSheetValues = [
    ['', '', '', '1', '', '', '', '', '2', '', '', '', '', '3', '', '', '', '', '4'],
    ['18Birdies Name', 'Spreadsheet Name', 'Total Pts', 'Score ', 'Hdcp', 'Net', 'Birdies', 'Pts (4)', 'Score ', 'Hdcp', 'Net', 'Birdies', 'Pts (4)', 'Score ', 'Hdcp', 'Net', 'Birdies', 'Pts (4)', 'Score ', 'Hdcp', 'Net', 'Birdies', 'Pts (4)'],
    ['Tony A.', 'Tony', '8.5', '', '', '', '', '0', '42', '16', '34', '1', '4', '45', '13', '38', '1', '0.5'],
    ['Josh H.', 'Josh', '3.5', '', '', '', '', '0', '41', '10', '36', '0', '1', '42', '8', '38', '0', '0.5'],
    ['Jared F.', 'Jared', '10', '', '', '', '', '0', '43', '16', '35', '0', '2', '41', '13', '34', '1', '4', '44', '13', '37', '0', '4'],
    ['Ian O.', 'Ian', '4', '', '', '', '', '0', '53', '25', '40', '0', '0', '46', '22', '35', '2', '2', '55', '22', '44', '0', '2'],
  ];

  const existingPlayers = buildExistingWeekScorecardPlayers({
    sheetValues: groupDSheetValues,
    weekNumber: 4,
    roster: ['Tony', 'Josh', 'Jared', 'Ian'],
    rowMap: { Tony: 3, Josh: 4, Jared: 5, Ian: 6 },
  });
  const mergedPlayers = mergeExistingAndExtractedScorecardPlayers({
    existingPlayers,
    extractedPlayers: [
      { player: 'Josh', rawScore: 42, handicap: 8, netScore: 38, birdies: 0, rowIndex: 1 },
      { player: 'Tony', rawScore: 43, handicap: 13, netScore: 36, birdies: 0, rowIndex: 2 },
    ],
  });
  const preview = buildScreenshotIngestionPreview({
    sheetValues: groupDSheetValues,
    weekNumber: 4,
    groupName: 'group4',
    roster: ['Tony', 'Josh', 'Jared', 'Ian'],
    extractedPlayers: mergedPlayers,
    defaultBirdies: 0,
  });

  assert.deepEqual(preview.rows.map(({ player, netScore, points, birdies }) => ({ player, netScore, points, birdies })), [
    { player: 'Tony', netScore: 36, points: 4, birdies: 0 },
    { player: 'Josh', netScore: 38, points: 1, birdies: 0 },
    { player: 'Jared', netScore: 37, points: 2, birdies: 0 },
    { player: 'Ian', netScore: 44, points: 0, birdies: 0 },
  ]);
});

test('re-ingestion preserves verified birdies when OCR omits them and accepts explicit zero', () => {
  const existingPlayers = [
    { player: 'Josh', rawScore: 39, handicap: 8, netScore: 36, birdies: 2, rowOrder: 1 },
    { player: 'Jared', rawScore: 40, handicap: 14, netScore: 35, birdies: 1, rowOrder: 2 },
  ];

  const merged = mergeExistingAndExtractedScorecardPlayers({
    existingPlayers,
    extractedPlayers: [
      { player: 'Josh', rawScore: 39, handicap: 8, netScore: 36, rowIndex: 1 },
      { player: 'Jared', rawScore: 40, handicap: 14, netScore: 35, birdies: 0, rowIndex: 2 },
    ],
  });

  assert.equal(merged.find(({ player }) => player === 'Josh').birdies, 2);
  assert.equal(merged.find(({ player }) => player === 'Jared').birdies, 0);
});

test('birdie preservation never backfills missing scores from stale sheet data', () => {
  const merged = mergeExistingAndExtractedScorecardPlayers({
    existingPlayers: [
      { player: 'Josh', rawScore: 39, handicap: 8, netScore: 36, birdies: 2, rowOrder: 1 },
    ],
    extractedPlayers: [
      { player: 'Josh', rawScore: 40, rowIndex: 1 },
    ],
  });

  assert.equal(merged[0].rawScore, 40);
  assert.equal(merged[0].handicap, undefined);
  assert.equal(merged[0].netScore, undefined);
  assert.equal(merged[0].birdies, 2);
});
