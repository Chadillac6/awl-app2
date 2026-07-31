#!/usr/bin/env node
import {
  buildRankUpdateValues,
  buildSortRangeRequest,
  buildTotalFormulaValues,
  buildWeeklyPointFormulaValues,
  LEADERBOARD_GROUP_BLOCKS,
} from '../src/lib/leaderboardSort.js';
import {
  batchUpdateSpreadsheet,
  getSpreadsheetValues,
  updateSpreadsheetValues,
} from '../src/lib/googleSheetsBatch.js';
import { updateLeaderboardBirdieKing } from '../src/lib/birdieKing.js';

const SHEET_ID = process.env.AWL_SHEET_ID ?? '1cv3aai-DNpyw-suyUtYlLrBFvmkStD_jkUYsyEK2zoI';
const LEADERBOARD_TAB = process.env.AWL_LEADERBOARD_TAB ?? 'Leaderboards';
const LEADERBOARD_SHEET_ID = Number(process.env.AWL_LEADERBOARD_SHEET_ID ?? 483982929);

const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, '').split('=');
  return [key, rest.length ? rest.join('=') : true];
}));

const selectedGroups = args.groups
  ? String(args.groups).split(',').map((group) => group.trim()).filter(Boolean)
  : Object.keys(LEADERBOARD_GROUP_BLOCKS);
const apply = Boolean(args.apply);

const getGroupRows = async (block) => {
  const result = await getSpreadsheetValues({
    spreadsheetId: SHEET_ID,
    range: `${LEADERBOARD_TAB}!B${block.startRow}:D${block.endRow}`,
  });
  return result.values ?? [];
};

const previews = await Promise.all(selectedGroups.map(async (groupName) => {
  const block = LEADERBOARD_GROUP_BLOCKS[groupName];
  if (!block) throw new Error(`Unknown leaderboard group: ${groupName}`);
  const rows = await getGroupRows(block);
  return {
    groupName,
    label: block.label,
    range: `${LEADERBOARD_TAB}!A${block.startRow}:Q${block.endRow}`,
    rankRange: `${LEADERBOARD_TAB}!B${block.startRow}:B${block.endRow}`,
    before: rows.map((row) => ({ rank: row[0], player: row[1], total: Number(row[2] ?? 0) })),
    block,
  };
}));

if (!apply) {
  console.log(JSON.stringify({ mode: 'preview', groups: previews }, null, 2));
  process.exit(0);
}

const requests = previews.map(({ block }) => buildSortRangeRequest({
  sheetId: LEADERBOARD_SHEET_ID,
  startRow: block.startRow,
  endRow: block.endRow,
}));

for (const { block } of previews) {
  // Keep leaderboard totals formula-driven before sorting. Older manual/static values can
  // otherwise sort stale rows after new scorecard points are written to Raw.
  await updateSpreadsheetValues({
    spreadsheetId: SHEET_ID,
    range: `${LEADERBOARD_TAB}!D${block.startRow}:D${block.endRow}`,
    values: buildTotalFormulaValues({ startRow: block.startRow, endRow: block.endRow }),
  });
  await updateSpreadsheetValues({
    spreadsheetId: SHEET_ID,
    range: `${LEADERBOARD_TAB}!E${block.startRow}:Q${block.endRow}`,
    values: buildWeeklyPointFormulaValues({ startRow: block.startRow, endRow: block.endRow }),
  });
}

const birdieKing = await updateLeaderboardBirdieKing({ spreadsheetId: SHEET_ID });

const result = await batchUpdateSpreadsheet({ spreadsheetId: SHEET_ID, requests });

for (const { block, rankRange } of previews) {
  await updateSpreadsheetValues({
    spreadsheetId: SHEET_ID,
    range: rankRange,
    values: buildRankUpdateValues({ count: block.endRow - block.startRow + 1 }),
  });
}

const after = await Promise.all(selectedGroups.map(async (groupName) => {
  const block = LEADERBOARD_GROUP_BLOCKS[groupName];
  const rows = await getGroupRows(block);
  return {
    groupName,
    label: block.label,
    after: rows.map((row) => ({ rank: row[0], player: row[1], total: Number(row[2] ?? 0) })),
  };
}));

console.log(JSON.stringify({
  mode: 'apply',
  sortedGroups: selectedGroups,
  replies: result.replies?.length ?? 0,
  birdieKing,
  before: previews.map(({ groupName, label, before }) => ({ groupName, label, before })),
  after,
}, null, 2));
