#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import {
  buildRankUpdateValues,
  buildSortRangeRequest,
  LEADERBOARD_GROUP_BLOCKS,
} from '../src/lib/leaderboardSort.js';
import { batchUpdateSpreadsheet } from '../src/lib/googleSheetsBatch.js';

const SHEET_ID = process.env.AWL_SHEET_ID ?? '1cv3aai-DNpyw-suyUtYlLrBFvmkStD_jkUYsyEK2zoI';
const LEADERBOARD_TAB = process.env.AWL_LEADERBOARD_TAB ?? 'Leaderboards';
const LEADERBOARD_SHEET_ID = Number(process.env.AWL_LEADERBOARD_SHEET_ID ?? 483982929);
const GOG = process.env.GOG_BIN ?? '/opt/homebrew/bin/gog';

const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, '').split('=');
  return [key, rest.length ? rest.join('=') : true];
}));

const selectedGroups = args.groups
  ? String(args.groups).split(',').map((group) => group.trim()).filter(Boolean)
  : Object.keys(LEADERBOARD_GROUP_BLOCKS);
const apply = Boolean(args.apply);

const runGogJson = (gogArgs) => JSON.parse(execFileSync(GOG, gogArgs, {
  encoding: 'utf8',
  env: process.env,
}));

const runGog = (gogArgs) => execFileSync(GOG, gogArgs, {
  encoding: 'utf8',
  env: process.env,
});

const getGroupRows = (block) => {
  const result = runGogJson(['sheets', 'get', SHEET_ID, `${LEADERBOARD_TAB}!B${block.startRow}:D${block.endRow}`, '--json']);
  return result.values ?? [];
};

const previews = selectedGroups.map((groupName) => {
  const block = LEADERBOARD_GROUP_BLOCKS[groupName];
  if (!block) throw new Error(`Unknown leaderboard group: ${groupName}`);
  const rows = getGroupRows(block);
  return {
    groupName,
    label: block.label,
    range: `${LEADERBOARD_TAB}!A${block.startRow}:Q${block.endRow}`,
    rankRange: `${LEADERBOARD_TAB}!B${block.startRow}:B${block.endRow}`,
    before: rows.map((row) => ({ rank: row[0], player: row[1], total: Number(row[2] ?? 0) })),
    block,
  };
});

if (!apply) {
  console.log(JSON.stringify({ mode: 'preview', groups: previews }, null, 2));
  process.exit(0);
}

const requests = previews.map(({ block }) => buildSortRangeRequest({
  sheetId: LEADERBOARD_SHEET_ID,
  startRow: block.startRow,
  endRow: block.endRow,
}));

const result = batchUpdateSpreadsheet({ spreadsheetId: SHEET_ID, requests });

for (const { block, rankRange } of previews) {
  runGog([
    'sheets', 'update', SHEET_ID, rankRange,
    '--values-json', JSON.stringify(buildRankUpdateValues({ count: block.endRow - block.startRow + 1 })),
    '--input', 'USER_ENTERED',
    '--no-input',
  ]);
}

const after = selectedGroups.map((groupName) => {
  const block = LEADERBOARD_GROUP_BLOCKS[groupName];
  const rows = getGroupRows(block);
  return {
    groupName,
    label: block.label,
    after: rows.map((row) => ({ rank: row[0], player: row[1], total: Number(row[2] ?? 0) })),
  };
});

console.log(JSON.stringify({
  mode: 'apply',
  sortedGroups: selectedGroups,
  replies: result.replies?.length ?? 0,
  before: previews.map(({ groupName, label, before }) => ({ groupName, label, before })),
  after,
}, null, 2));
