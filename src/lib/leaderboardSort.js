export const LEADERBOARD_GROUP_BLOCKS = {
  group1: { label: 'Group A', startRow: 5, endRow: 8 },
  group2: { label: 'Group B', startRow: 10, endRow: 13 },
  group3: { label: 'Group C', startRow: 15, endRow: 18 },
  group4: { label: 'Group D', startRow: 20, endRow: 23 },
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const sortLeaderboardRows = (rows = []) => rows
  .map((row, index) => ({ row: [...row], originalIndex: index }))
  .sort((a, b) => {
    const pointsDiff = toNumber(b.row[3]) - toNumber(a.row[3]);
    if (pointsDiff !== 0) return pointsDiff;
    return a.originalIndex - b.originalIndex;
  })
  .map(({ row }, index) => {
    const sorted = [...row];
    sorted[1] = String(index + 1);
    return sorted;
  });

export const groupSortPreview = ({ groupName, rows }) => {
  const sortedRows = sortLeaderboardRows(rows);
  return {
    groupName,
    before: rows.map((row) => ({ rank: row[1], player: row[2], total: toNumber(row[3]) })),
    after: sortedRows.map((row) => ({ rank: row[1], player: row[2], total: toNumber(row[3]) })),
    sortedRows,
  };
};

export const buildSortRangeRequest = ({
  sheetId,
  startRow,
  endRow,
  startColumn = 1,
  endColumn = 17,
  totalColumnIndex = 4,
  rankColumnIndex = 2,
}) => ({
  sortRange: {
    range: {
      sheetId,
      startRowIndex: startRow - 1,
      endRowIndex: endRow,
      startColumnIndex: startColumn - 1,
      endColumnIndex: endColumn,
    },
    sortSpecs: [
      {
        dimensionIndex: totalColumnIndex - 1,
        sortOrder: 'DESCENDING',
      },
      {
        dimensionIndex: rankColumnIndex - 1,
        sortOrder: 'ASCENDING',
      },
    ],
  },
});

export const buildRankUpdateValues = ({ startRank = 1, count }) => Array.from({ length: count }, (_, index) => [String(startRank + index)]);
