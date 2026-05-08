import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildRankUpdateValues,
  buildSortRangeRequest,
  groupSortPreview,
  sortLeaderboardRows,
} from '../src/lib/leaderboardSort.js';

const groupCRows = [
  ['', '1', 'Joey', '0'],
  ['', '2', 'Basar', '0'],
  ['', '3', 'Baker', '2', '2'],
  ['', '4', 'Andulics', '4', '4'],
];

test('sortLeaderboardRows sorts whole rows by total points descending and rewrites ranks', () => {
  const sorted = sortLeaderboardRows(groupCRows);

  assert.deepEqual(sorted.map((row) => [row[1], row[2], row[3], row[4] ?? '']), [
    ['1', 'Andulics', '4', '4'],
    ['2', 'Baker', '2', '2'],
    ['3', 'Joey', '0', ''],
    ['4', 'Basar', '0', ''],
  ]);
});

test('sortLeaderboardRows keeps ties stable to avoid random row drift', () => {
  const sorted = sortLeaderboardRows([
    ['', '1', 'A', '2', 'x'],
    ['', '2', 'B', '2', 'y'],
    ['', '3', 'C', '1', 'z'],
  ]);

  assert.deepEqual(sorted.map((row) => row[2]), ['A', 'B', 'C']);
});

test('groupSortPreview shows before and after player order', () => {
  const preview = groupSortPreview({ groupName: 'group3', rows: groupCRows });

  assert.deepEqual(preview.before.map((row) => row.player), ['Joey', 'Basar', 'Baker', 'Andulics']);
  assert.deepEqual(preview.after.map((row) => row.player), ['Andulics', 'Baker', 'Joey', 'Basar']);
});

test('buildSortRangeRequest targets a whole group row block', () => {
  assert.deepEqual(buildSortRangeRequest({ sheetId: 483982929, startRow: 15, endRow: 18 }), {
    sortRange: {
      range: {
        sheetId: 483982929,
        startRowIndex: 14,
        endRowIndex: 18,
        startColumnIndex: 0,
        endColumnIndex: 17,
      },
      sortSpecs: [
        { dimensionIndex: 3, sortOrder: 'DESCENDING' },
        { dimensionIndex: 1, sortOrder: 'ASCENDING' },
      ],
    },
  });
});

test('buildRankUpdateValues emits sequential ranks after sorting', () => {
  assert.deepEqual(buildRankUpdateValues({ count: 4 }), [['1'], ['2'], ['3'], ['4']]);
});
