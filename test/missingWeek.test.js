import test from 'node:test';
import assert from 'node:assert/strict';

import { buildMissingWeekPlan, SOFT_RED } from '../src/lib/missingWeek.js';

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

test('buildMissingWeekPlan maps Joe F. to Joey row and keeps score/hdcp/net blank', () => {
  const plan = buildMissingWeekPlan({
    sheetValues,
    weekNumber: 1,
    playerName: 'Joe F.',
    sheetId: 1427498880,
  });

  assert.equal(plan.sheetName, 'Joey');
  assert.equal(plan.rowNumber, 13);
  assert.deepEqual(plan.columns, { score: 'D', handicap: 'E', net: 'F', birdies: 'G', points: 'H' });
  assert.equal(plan.range, 'Raw!D13:H13');
  assert.deepEqual(plan.values, [['', '', '', 0, 0]]);
  assert.deepEqual(plan.summary, {
    score: 'blank',
    handicap: 'blank',
    net: 'blank',
    birdies: 0,
    points: 0,
    highlight: 'soft red',
  });
});

test('buildMissingWeekPlan creates a soft-red format request for the full week block', () => {
  const plan = buildMissingWeekPlan({
    sheetValues,
    weekNumber: 1,
    playerName: 'Joe F.',
    sheetId: 1427498880,
  });

  assert.deepEqual(plan.formatRequest, {
    repeatCell: {
      range: {
        sheetId: 1427498880,
        startRowIndex: 12,
        endRowIndex: 13,
        startColumnIndex: 3,
        endColumnIndex: 8,
      },
      cell: {
        userEnteredFormat: {
          backgroundColor: SOFT_RED,
        },
      },
      fields: 'userEnteredFormat.backgroundColor',
    },
  });
});
