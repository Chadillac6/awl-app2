#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { buildScreenshotIngestionPreview } from '../src/lib/scorecardIngestion.js';
import { DEFAULT_GROUPS } from '../src/lib/scoreIngestion.js';

const SHEET_ID = process.env.AWL_SHEET_ID ?? '1cv3aai-DNpyw-suyUtYlLrBFvmkStD_jkUYsyEK2zoI';
const TAB = process.env.AWL_RAW_TAB ?? 'Raw';
const GOG = process.env.GOG_BIN ?? '/opt/homebrew/bin/gog';

const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, '').split('=');
  return [key, rest.length ? rest.join('=') : true];
}));

const requireArg = (name) => {
  if (!args[name]) throw new Error(`Missing --${name}`);
  return args[name];
};

const runGogJson = (gogArgs) => JSON.parse(execFileSync(GOG, gogArgs, {
  encoding: 'utf8',
  env: process.env,
}));

const runGog = (gogArgs) => execFileSync(GOG, gogArgs, {
  encoding: 'utf8',
  env: process.env,
});

const weekNumber = Number(requireArg('week'));
const groupName = requireArg('group');
const roster = args.roster ? JSON.parse(args.roster) : DEFAULT_GROUPS[groupName];
const extractedPlayers = JSON.parse(requireArg('players-json'));
const apply = Boolean(args.apply);
const sortLeaderboards = args['sort-leaderboards'] !== 'false';
const notifyFleet = Boolean(args.notify);

if (!Number.isInteger(weekNumber) || weekNumber < 1) throw new Error('--week must be a positive integer');
if (!Array.isArray(roster) || roster.length === 0) throw new Error(`No roster found for ${groupName}`);

const sheet = runGogJson(['sheets', 'get', SHEET_ID, `${TAB}!A1:ZZ21`, '--json']);
const sheetValues = sheet.values ?? [];

const preview = buildScreenshotIngestionPreview({
  sheetValues,
  weekNumber,
  groupName,
  roster,
  extractedPlayers,
  defaultBirdies: 0,
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
  updates,
  issues: preview.group.issues,
  requiresTieConfirmation: preview.group.requiresTieConfirmation,
};

if (!apply) {
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}

if (preview.group.requiresTieConfirmation) {
  throw new Error('Tie detected; approval/tiebreak confirmation required before writing');
}

for (const update of updates) {
  runGog([
    'sheets', 'update', SHEET_ID, update.range,
    '--values-json', JSON.stringify(update.values),
    '--input', 'USER_ENTERED',
    '--no-input',
  ]);
}

if (sortLeaderboards) {
  const sortOutput = execFileSync(process.execPath, ['scripts/sort-leaderboards.mjs', '--apply'], {
    encoding: 'utf8',
    env: process.env,
  });
  summary.leaderboardSort = JSON.parse(sortOutput);
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
