import test from 'node:test';
import assert from 'node:assert/strict';

import { buildSortRangeRequest, LEADERBOARD_GROUP_BLOCKS } from '../src/lib/leaderboardSort.js';

test('all leaderboard groups have stable four-row sort blocks', () => {
  assert.deepEqual(LEADERBOARD_GROUP_BLOCKS, {
    group1: { label: 'Group A', startRow: 5, endRow: 8 },
    group2: { label: 'Group B', startRow: 10, endRow: 13 },
    group3: { label: 'Group C', startRow: 15, endRow: 18 },
    group4: { label: 'Group D', startRow: 20, endRow: 23 },
  });
});

test('all group sort requests sort whole A:Q rows by Total column D', () => {
  const requests = Object.values(LEADERBOARD_GROUP_BLOCKS).map((block) => buildSortRangeRequest({
    sheetId: 483982929,
    startRow: block.startRow,
    endRow: block.endRow,
  }));

  assert.equal(requests.length, 4);
  assert.deepEqual(requests.map((request) => request.sortRange.range), [
    { sheetId: 483982929, startRowIndex: 4, endRowIndex: 8, startColumnIndex: 0, endColumnIndex: 17 },
    { sheetId: 483982929, startRowIndex: 9, endRowIndex: 13, startColumnIndex: 0, endColumnIndex: 17 },
    { sheetId: 483982929, startRowIndex: 14, endRowIndex: 18, startColumnIndex: 0, endColumnIndex: 17 },
    { sheetId: 483982929, startRowIndex: 19, endRowIndex: 23, startColumnIndex: 0, endColumnIndex: 17 },
  ]);
  requests.forEach((request) => {
    assert.deepEqual(request.sortRange.sortSpecs, [
      { dimensionIndex: 3, sortOrder: 'DESCENDING' },
      { dimensionIndex: 1, sortOrder: 'ASCENDING' },
    ]);
  });
});
