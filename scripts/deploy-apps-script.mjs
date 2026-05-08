#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const SHEET_ID = process.env.AWL_SHEET_ID ?? '1cv3aai-DNpyw-suyUtYlLrBFvmkStD_jkUYsyEK2zoI';
const GOG = process.env.GOG_BIN ?? '/opt/homebrew/bin/gog';

const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, '').split('=');
  return [key, rest.length ? rest.join('=') : true];
}));

const run = (command, commandArgs) => execFileSync(command, commandArgs, {
  encoding: 'utf8',
  env: process.env,
});

const runJson = (command, commandArgs) => JSON.parse(run(command, commandArgs));

const getGoogleAccessToken = () => {
  const tokenPath = `/tmp/gog-token-${process.pid}.json`;
  run(GOG, ['auth', 'tokens', 'export', process.env.GOG_ACCOUNT || 'chad.supers@gmail.com', '--out', tokenPath, '--no-input']);
  const token = JSON.parse(readFileSync(tokenPath, 'utf8'));
  const credentials = JSON.parse(readFileSync('/Users/Bot/Library/Application Support/gogcli/credentials.json', 'utf8'));
  const body = new URLSearchParams({
    client_id: credentials.client_id,
    client_secret: credentials.client_secret,
    refresh_token: token.refresh_token,
    grant_type: 'refresh_token',
  });
  const response = run('curl', ['--silent', '--show-error', '--fail', 'https://oauth2.googleapis.com/token', '-H', 'Content-Type: application/x-www-form-urlencoded', '--data', body.toString()]);
  return JSON.parse(response).access_token;
};

let scriptId = args['script-id'] || process.env.AWL_APPS_SCRIPT_ID;
if (!scriptId) {
  const created = runJson(GOG, ['appscript', 'create', '--title=AWL Push Admin', `--parent-id=${SHEET_ID}`, '--json', '--no-input']);
  scriptId = created.scriptId || created.script_id || created.id;
}
if (!scriptId) throw new Error('Could not determine Apps Script ID');

const files = [
  {
    name: 'appsscript',
    type: 'JSON',
    source: readFileSync('scripts/apps-script/appsscript.json', 'utf8'),
  },
  {
    name: 'Code',
    type: 'SERVER_JS',
    source: readFileSync('scripts/apps-script/Code.gs', 'utf8'),
  },
];

const accessToken = getGoogleAccessToken();
run('curl', [
  '--silent', '--show-error', '--fail',
  `https://script.googleapis.com/v1/projects/${scriptId}/content`,
  '-X', 'PUT',
  '-H', `Authorization: Bearer ${accessToken}`,
  '-H', 'Content-Type: application/json',
  '--data', JSON.stringify({ files }),
]);

console.log(JSON.stringify({ scriptId, success: true }, null, 2));
