#!/usr/bin/env node
import { getGoogleAccessToken } from '../src/lib/googleAuth.js';

const SHEET_ID = process.env.AWL_SHEET_ID ?? '1cv3aai-DNpyw-suyUtYlLrBFvmkStD_jkUYsyEK2zoI';

const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, '').split('=');
  return [key, rest.length ? rest.join('=') : true];
}));

const siteUrl = args.url || process.env.AWL_APP_URL;
const configuredEndpoint = args.endpoint || process.env.AWL_PUSH_ENDPOINT;
let adminKey = args.key || process.env.AWL_PUSH_ADMIN_API_KEY || process.env.ADMIN_API_KEY;

const readSheetPushConfig = async () => {
  const token = await getGoogleAccessToken();
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?ranges=${encodeURIComponent('Leaderboards!A1')}&includeGridData=true&fields=sheets(data(rowData(values(note))))`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (!response.ok) throw new Error(`Could not read Leaderboards!A1 push config note (${response.status}): ${await response.text()}`);
  const data = await response.json();
  const note = data?.sheets?.[0]?.data?.[0]?.rowData?.[0]?.values?.[0]?.note;
  if (!note) return {};
  return JSON.parse(note);
};

let endpoint = configuredEndpoint || (siteUrl ? new URL('/api/send-notification', siteUrl).href : null);

if (!endpoint || !adminKey) {
  const sheetConfig = await readSheetPushConfig();
  endpoint = endpoint || sheetConfig.endpoint;
  adminKey = adminKey || sheetConfig.adminKey;
}

if (!endpoint) throw new Error('Missing --endpoint, --url/AWL_APP_URL, AWL_PUSH_ENDPOINT, or Leaderboards!A1 note endpoint');
if (!adminKey) throw new Error('Missing --key/AWL_PUSH_ADMIN_API_KEY/ADMIN_API_KEY or Leaderboards!A1 note adminKey');

const payload = {
  title: args.title || 'Leaderboard Update',
  body: args.body || 'New scores are in. Check the leaderboard.',
  url: args.target || '/',
};

const response = await fetch(endpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${adminKey}`,
  },
  body: JSON.stringify(payload),
});

const text = await response.text();
if (!response.ok) throw new Error(`Notification failed (${response.status}): ${text}`);
console.log(text);
