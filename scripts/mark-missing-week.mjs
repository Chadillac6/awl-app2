#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { buildMissingWeekPlan } from '../src/lib/missingWeek.js';
import { batchUpdateSpreadsheet } from '../src/lib/googleSheetsBatch.js';

const SHEET_ID = process.env.AWL_SHEET_ID ?? '1cv3aai-DNpyw-suyUtYlLrBFvmkStD_jkUYsyEK2zoI';
const RAW_TAB = process.env.AWL_RAW_TAB ?? 'Raw';
const RAW_SHEET_ID = Number(process.env.AWL_RAW_SHEET_ID ?? 1427498880);
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
const playerName = requireArg('player');
const apply = Boolean(args.apply);
const sortLeaderboards = args['sort-leaderboards'] !== 'false';
const notifyFleet = Boolean(args.notify);

if (!Number.isInteger(weekNumber) || weekNumber < 1) throw new Error('--week must be a positive integer');

const sheet = runGogJson(['sheets', 'get', SHEET_ID, `${RAW_TAB}!A1:ZZ21`, '--json']);
const sheetValues = sheet.values ?? [];
const plan = buildMissingWeekPlan({
  sheetValues,
  weekNumber,
  playerName,
  tab: RAW_TAB,
  sheetId: RAW_SHEET_ID,
});

const summary = {
  mode: apply ? 'apply' : 'preview',
  playerName,
  sheetName: plan.sheetName,
  weekNumber,
  update: {
    range: plan.range,
    values: plan.values,
    summary: plan.summary,
  },
};

if (!apply) {
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}

runGog([
  'sheets', 'update', SHEET_ID, plan.range,
  '--values-json', JSON.stringify(plan.values),
  '--input', 'USER_ENTERED',
  '--no-input',
]);

batchUpdateSpreadsheet({ spreadsheetId: SHEET_ID, requests: [plan.formatRequest] });

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
