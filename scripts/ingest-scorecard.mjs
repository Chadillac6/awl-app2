#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import {
  buildExistingWeekScorecardPlayers,
  buildScreenshotIngestionPreview,
  mergeExistingAndExtractedScorecardPlayers,
} from '../src/lib/scorecardIngestion.js';
import { buildSheetPlayerMaps, DEFAULT_GROUPS } from '../src/lib/scoreIngestion.js';
import { getSpreadsheetValues, updateSpreadsheetValues } from '../src/lib/googleSheetsBatch.js';
import { updateLeaderboardBirdieKing } from '../src/lib/birdieKing.js';
import { parseOptInBoolean } from '../src/lib/cliArgs.js';

const SHEET_ID = process.env.AWL_SHEET_ID ?? '1cv3aai-DNpyw-suyUtYlLrBFvmkStD_jkUYsyEK2zoI';
const TAB = process.env.AWL_RAW_TAB ?? 'Raw';

const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, '').split('=');
  return [key, rest.length ? rest.join('=') : true];
}));

const requireArg = (name) => {
  if (!args[name]) throw new Error(`Missing --${name}`);
  return args[name];
};

const weekNumber = Number(requireArg('week'));
const groupName = requireArg('group');
const roster = args.roster ? JSON.parse(args.roster) : DEFAULT_GROUPS[groupName];
const extractedPlayers = JSON.parse(requireArg('players-json'));
const apply = Boolean(args.apply);
const sortLeaderboards = args['sort-leaderboards'] !== 'false';
const notifyFleet = Boolean(args.notify);
const strictOcrRows = args['strict-ocr-rows'] !== 'false';
// AWL regular-week ties split points automatically. This gate is available
// only for exceptional/manual rounds that explicitly request confirmation.
const requireTieConfirmation = parseOptInBoolean(
  args['require-tie-confirmation'],
  'require-tie-confirmation',
);
const allowConfirmedTies = Boolean(args['allow-ties'] || args['tie-confirmed']);

if (!Number.isInteger(weekNumber) || weekNumber < 1) throw new Error('--week must be a positive integer');
if (!Array.isArray(roster) || roster.length === 0) throw new Error(`No roster found for ${groupName}`);

const hasRowHints = extractedPlayers.some((player) => Number.isFinite(
  player.rowOrder ?? player.rowIndex ?? player.rowNumber ?? player.ocrRow ?? player.lineIndex ?? player.sourceRow ?? player.y ?? player.top,
));

if (strictOcrRows && extractedPlayers.length > 1 && !hasRowHints) {
  throw new Error('OCR rows must include rowIndex/rowNumber/ocrRow/sourceRow so names and scores can be matched safely');
}

const sheet = await getSpreadsheetValues({ spreadsheetId: SHEET_ID, range: `${TAB}!A1:ZZ21` });
const sheetValues = sheet.values ?? [];
const { aliasMap, rowMap } = buildSheetPlayerMaps(sheetValues);

const existingPlayers = buildExistingWeekScorecardPlayers({
  sheetValues,
  weekNumber,
  roster,
  rowMap,
});
const mergedPlayers = mergeExistingAndExtractedScorecardPlayers({
  existingPlayers,
  extractedPlayers,
  aliasMap,
});

const preview = buildScreenshotIngestionPreview({
  sheetValues,
  weekNumber,
  groupName,
  roster,
  extractedPlayers: mergedPlayers,
  defaultBirdies: 0,
  requireTieConfirmation,
});

const writeRows = preview.rows.filter((row) => row.status === 'scored');
const updates = writeRows.map((row) => ({
  range: `${TAB}!${row.cells.score}:${row.cells.points}`,
  values: [[row.values.score, row.values.handicap, row.values.net, row.values.birdies, row.values.points]],
  player: row.player,
}));

const summary = {
  mode: apply ? 'apply' : 'preview',
  weekNumber,
  groupName,
  mergedExistingPlayers: existingPlayers.length,
  submittedPlayers: extractedPlayers.length,
  updates,
  issues: preview.group.issues,
  requiresTieConfirmation: preview.group.requiresTieConfirmation,
};

if (!apply) {
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}

if (preview.group.requiresTieConfirmation && !allowConfirmedTies) {
  throw new Error('Tie detected; approval/tiebreak confirmation required before writing. Re-run with --allow-ties after Chad confirms split points.');
}

for (const update of updates) {
  await updateSpreadsheetValues({
    spreadsheetId: SHEET_ID,
    range: update.range,
    values: update.values,
  });
}

if (sortLeaderboards) {
  const sortOutput = execFileSync(process.execPath, ['scripts/sort-leaderboards.mjs', '--apply'], {
    encoding: 'utf8',
    env: process.env,
  });
  summary.leaderboardSort = JSON.parse(sortOutput);
} else {
  summary.birdieKing = await updateLeaderboardBirdieKing({ spreadsheetId: SHEET_ID });
}

if (notifyFleet) {
  const notifyOutput = execFileSync(process.execPath, [
    'scripts/send-leaderboard-notification.mjs',
    '--title=Leaderboard Update',
    '--body=New scores are in. Check the leaderboard.',
  ], {
    encoding: 'utf8',
    env: process.env,
  });
  summary.notification = JSON.parse(notifyOutput);
}

console.log(JSON.stringify(summary, null, 2));
