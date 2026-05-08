import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildAliasMap,
  buildGroupScoreState,
  buildRoundPreview,
  buildRowMap,
  buildSheetPlayerMaps,
  buildWritePlan,
  coerceNumber,
  normalizeName,
  parseWeekColumnsFromSheetValues,
  scoreSubmittedPlayers,
  weekIndexToColumns,
} from '../src/lib/scoreIngestion.js';

test('normalizeName handles punctuation and case', () => {
  assert.equal(normalizeName("Ian O'Neil"), 'ian oneil');
  assert.equal(normalizeName('  Chucky.  '), 'chucky');
});

test('buildAliasMap maps 18Birdies names to sheet names', () => {
  const map = buildAliasMap([
    { birdiesName: 'Chucky', sheetName: 'Chuck' },
    { birdiesName: 'Dulix', sheetName: 'Joe Andulics' },
  ]);

  assert.equal(map.chucky, 'Chuck');
  assert.equal(map.dulix, 'Joe Andulics');
});

test('buildRowMap maps spreadsheet names to exact sheet rows', () => {
  const rowMap = buildRowMap([
    { birdiesName: 'Chucky', sheetName: 'Chuck', rowNumber: 3 },
    { birdiesName: 'Chad', sheetName: 'Chad', rowNumber: 4 },
  ]);

  assert.deepEqual(rowMap, { Chuck: 3, Chad: 4 });
});

test('buildSheetPlayerMaps maps Raw tab A/B player rows including row numbers', () => {
  const sheetValues = [[], [], ['Richard B.', 'Baker'], ['Joe A.', 'Andulics']];
  const maps = buildSheetPlayerMaps(sheetValues, { startRow: 3, endRow: 4 });

  assert.equal(maps.aliasMap['richard b'], 'Baker');
  assert.equal(maps.aliasMap['joe a'], 'Andulics');
  assert.deepEqual(maps.rowMap, { Baker: 3, Andulics: 4 });
});

test('weekIndexToColumns advances in score/handicap/net/birdies/points blocks', () => {
  assert.deepEqual(weekIndexToColumns(0), { score: 'D', handicap: 'E', net: 'F', birdies: 'G', points: 'H' });
  assert.deepEqual(weekIndexToColumns(1), { score: 'I', handicap: 'J', net: 'K', birdies: 'L', points: 'M' });
  assert.deepEqual(weekIndexToColumns(2), { score: 'N', handicap: 'O', net: 'P', birdies: 'Q', points: 'R' });
  assert.deepEqual(weekIndexToColumns(8), { score: 'AR', handicap: 'AS', net: 'AT', birdies: 'AU', points: 'AV' });
});

test('parseWeekColumnsFromSheetValues reads live header order dynamically', () => {
  const sheetValues = [
    ['', '', '', '1', '', '', '', '', '2'],
    ['18Birdies Name', 'Spreadsheet Name', 'Total Pts', 'Score ', 'Hdcp', 'Net', 'Birdies', 'Pts (4)', 'Score ', 'Hdcp', 'Net', 'Birdies', 'Pts (4)'],
  ];

  assert.deepEqual(parseWeekColumnsFromSheetValues(sheetValues, 1), { score: 'D', handicap: 'E', net: 'F', birdies: 'G', points: 'H' });
  assert.deepEqual(parseWeekColumnsFromSheetValues(sheetValues, 2), { score: 'I', handicap: 'J', net: 'K', birdies: 'L', points: 'M' });
});

test('coerceNumber accepts string numeric inputs', () => {
  assert.equal(coerceNumber('40'), 40);
  assert.equal(coerceNumber(' 10 '), 10);
  assert.equal(coerceNumber(''), null);
});

test('scoreSubmittedPlayers awards 4 and 2 for two submitted untied scores', () => {
  const result = scoreSubmittedPlayers([
    { player: 'Chuck', netScore: '40', rawScore: '50', handicap: '10' },
    { player: 'Chad', netScore: '43', rawScore: '53', handicap: '10' },
  ]);

  assert.deepEqual(result.scored.map(({ player, points }) => ({ player, points })), [
    { player: 'Chuck', points: 4 },
    { player: 'Chad', points: 2 },
  ]);
  assert.equal(result.requiresTieConfirmation, false);
});

test('scoreSubmittedPlayers splits tied places across available point slots', () => {
  const result = scoreSubmittedPlayers([
    { player: 'Chuck', netScore: 40 },
    { player: 'Chad', netScore: 40 },
    { player: 'Carp', netScore: 44 },
  ]);

  assert.deepEqual(result.scored.map(({ player, points }) => ({ player, points })), [
    { player: 'Chuck', points: 3 },
    { player: 'Chad', points: 3 },
    { player: 'Carp', points: 1 },
  ]);
  assert.equal(result.requiresTieConfirmation, true);
});

test('buildGroupScoreState leaves missing players pending until finalized', () => {
  const result = buildGroupScoreState({
    groupName: 'group1',
    roster: ['Chuck', 'Chad', 'Carp', 'Glen'],
    submittedScores: [
      { player: 'Chuck', netScore: 40, rawScore: 50, handicap: 10 },
      { player: 'Chad', netScore: 43, rawScore: 53, handicap: 10 },
    ],
  });

  assert.deepEqual(result.players.map(({ player, points, status }) => ({ player, points, status })), [
    { player: 'Chuck', points: 4, status: 'scored' },
    { player: 'Chad', points: 2, status: 'scored' },
    { player: 'Carp', points: null, status: 'pending' },
    { player: 'Glen', points: null, status: 'pending' },
  ]);
});

test('buildGroupScoreState surfaces duplicate and unmatched submitted names', () => {
  const result = buildGroupScoreState({
    groupName: 'group1',
    roster: ['Chuck', 'Chad', 'Carp', 'Glen'],
    submittedScores: [
      { player: 'Chucky', netScore: 40, rawScore: 50, handicap: 10 },
      { player: 'Chucky', netScore: 41, rawScore: 51, handicap: 10 },
      { player: 'Ghost', netScore: 44, rawScore: 54, handicap: 10 },
    ],
    aliasMap: buildAliasMap([{ birdiesName: 'Chucky', sheetName: 'Chuck' }]),
  });

  assert.equal(result.issues.duplicateSubmittedNames.length, 1);
  assert.equal(result.issues.unmatchedSubmittedScores.length, 1);
});

test('buildGroupScoreState honors alias mapping for submitted names', () => {
  const aliasMap = buildAliasMap([
    { birdiesName: 'Chucky', sheetName: 'Chuck' },
  ]);

  const result = buildGroupScoreState({
    groupName: 'group1',
    roster: ['Chuck', 'Chad', 'Carp', 'Glen'],
    submittedScores: [
      { player: 'Chucky', netScore: 40, rawScore: 50, handicap: 10 },
      { player: 'Chad', netScore: 43, rawScore: 53, handicap: 10 },
    ],
    aliasMap,
  });

  assert.deepEqual(result.players.map(({ player, points, status, rawScore }) => ({ player, points, status, rawScore })), [
    { player: 'Chuck', points: 4, status: 'scored', rawScore: 50 },
    { player: 'Chad', points: 2, status: 'scored', rawScore: 53 },
    { player: 'Carp', points: null, status: 'pending', rawScore: undefined },
    { player: 'Glen', points: null, status: 'pending', rawScore: undefined },
  ]);
});

test('buildGroupScoreState matches roster names case-insensitively', () => {
  const result = buildGroupScoreState({
    groupName: 'group1',
    roster: ['Chuck', 'Chad', 'Carp', 'Glen'],
    submittedScores: [
      { player: 'chucky', netScore: 40, rawScore: 50, handicap: 10 },
      { player: 'CHAD', netScore: 43, rawScore: 53, handicap: 10 },
    ],
    aliasMap: buildAliasMap([{ birdiesName: 'Chucky', sheetName: 'Chuck' }]),
  });

  assert.deepEqual(result.players.slice(0, 2).map(({ player, points, status }) => ({ player, points, status })), [
    { player: 'Chuck', points: 4, status: 'scored' },
    { player: 'Chad', points: 2, status: 'scored' },
  ]);
});

test('buildGroupScoreState assigns zero to missing players when finalized', () => {
  const result = buildGroupScoreState({
    groupName: 'group1',
    roster: ['Chuck', 'Chad', 'Carp', 'Glen'],
    submittedScores: [
      { player: 'Chuck', netScore: 40, rawScore: 50, handicap: 10 },
      { player: 'Chad', netScore: 43, rawScore: 53, handicap: 10 },
    ],
    finalizeMissingPlayers: true,
  });

  assert.deepEqual(result.players.map(({ player, points, status }) => ({ player, points, status })), [
    { player: 'Chuck', points: 4, status: 'scored' },
    { player: 'Chad', points: 2, status: 'scored' },
    { player: 'Carp', points: 0, status: 'missing-final' },
    { player: 'Glen', points: 0, status: 'missing-final' },
  ]);
});

test('buildRoundPreview returns row data for approval before write', () => {
  const preview = buildRoundPreview({
    weekIndex: 0,
    groupName: 'group1',
    roster: ['Chuck', 'Chad', 'Carp', 'Glen'],
    submittedScores: [
      { player: 'Chuck', netScore: 40, rawScore: 50, handicap: 10 },
      { player: 'Chad', netScore: 43, rawScore: 53, handicap: 10 },
    ],
    birdiesByPlayer: { Chuck: 1 },
  });

  assert.deepEqual(preview.columns, { score: 'D', handicap: 'E', net: 'F', birdies: 'G', points: 'H' });
  assert.deepEqual(preview.rows[0], {
    rowNumber: 3,
    player: 'Chuck',
    cells: {
      score: 'D3',
      handicap: 'E3',
      net: 'F3',
      birdies: 'G3',
      points: 'H3',
    },
    values: {
      score: 50,
      handicap: 10,
      net: 40,
      birdies: 1,
      points: 4,
    },
    rawScore: 50,
    handicap: 10,
    netScore: 40,
    points: 4,
    birdies: 1,
    status: 'scored',
  });
  assert.equal(preview.rows[2].status, 'pending');
});

test('buildWritePlan emits exact cell targets for the approval step', () => {
  const plan = buildWritePlan({
    weekIndex: 0,
    rowMap: { Chuck: 3, Chad: 4, Carp: 5, Glen: 6 },
    groupName: 'group1',
    roster: ['Chuck', 'Chad', 'Carp', 'Glen'],
    submittedScores: [
      { player: 'Chuck', netScore: '40', rawScore: '50', handicap: '10' },
      { player: 'Chad', netScore: '43', rawScore: '53', handicap: '10' },
    ],
    birdiesByPlayer: { Chuck: 1, Chad: 0 },
  });

  assert.deepEqual(plan.rows[0].cells, { score: 'D3', handicap: 'E3', net: 'F3', birdies: 'G3', points: 'H3' });
  assert.deepEqual(plan.rows[1].values, { score: 53, handicap: 10, net: 43, birdies: 0, points: 2 });
});
