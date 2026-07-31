#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { buildMissingWeekPlan } from '../src/lib/missingWeek.js';
import {
  batchUpdateSpreadsheet,
  getSpreadsheetValues,
  updateSpreadsheetValues,
} from '../src/lib/googleSheetsBatch.js';
import { updateLeaderboardBirdieKing } from '../src/lib/birdieKing.js';

const SHEET_ID = process.env.AWL_SHEET_ID ?? '1cv3aai-DNpyw-suyUtYlLrBFvmkStD_jkUYsyEK2zoI';
const RAW_TAB = process.env.AWL_RAW_TAB ?? 'Raw';
const RAW_SHEET_ID = Number(process.env.AWL_RAW_SHEET_ID ?? 1427498880);

const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, '').split('=');
  return [key, rest.length ? rest.join('=') : true];
}));

const requireArg = (name) => {
  if (!args[name]) throw new Error(`Missing --${name}`);
  return args[name];
};

const weekNumber = Number(requireArg('week'));
const playerName = requireArg('player');
const apply = Boolean(args.apply);
const sortLeaderboards = args['sort-leaderboards'] !== 'false';
const notifyFleet = Boolean(args.notify);

if (!Number.isInteger(weekNumber) || weekNumber < 1) throw new Error('--week must be a positive integer');

const sheet = await getSpreadsheetValues({ spreadsheetId: SHEET_ID, range: `${RAW_TAB}!A1:ZZ21` });
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

await updateSpreadsheetValues({
  spreadsheetId: SHEET_ID,
  range: plan.range,
  values: plan.values,
});

await batchUpdateSpreadsheet({ spreadsheetId: SHEET_ID, requests: [plan.formatRequest] });

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
