import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const DEFAULT_GOG = '/opt/homebrew/bin/gog';
const DEFAULT_CREDENTIALS = '/Users/Bot/Library/Application Support/gogcli/credentials.json';

const run = (command, args, options = {}) => execFileSync(command, args, {
  encoding: 'utf8',
  env: process.env,
  ...options,
});

export const getGoogleAccessToken = ({
  account = process.env.GOG_ACCOUNT ?? 'chad.supers@gmail.com',
  gogBin = process.env.GOG_BIN ?? DEFAULT_GOG,
  credentialsPath = process.env.GOG_CREDENTIALS_PATH ?? DEFAULT_CREDENTIALS,
} = {}) => {
  const tokenPath = join(tmpdir(), `gog-token-${process.pid}-${Date.now()}.json`);

  try {
    run(gogBin, ['auth', 'tokens', 'export', account, '--out', tokenPath, '--no-input']);
    const token = JSON.parse(readFileSync(tokenPath, 'utf8'));
    const credentials = JSON.parse(readFileSync(credentialsPath, 'utf8'));
    const body = new URLSearchParams({
      client_id: credentials.client_id,
      client_secret: credentials.client_secret,
      refresh_token: token.refresh_token,
      grant_type: 'refresh_token',
    });

    const response = run('curl', [
      '--silent', '--show-error', '--fail',
      'https://oauth2.googleapis.com/token',
      '-H', 'Content-Type: application/x-www-form-urlencoded',
      '--data', body.toString(),
    ]);

    const parsed = JSON.parse(response);
    if (!parsed.access_token) throw new Error('Google token response did not include access_token');
    return parsed.access_token;
  } finally {
    rmSync(tokenPath, { force: true });
  }
};

export const batchUpdateSpreadsheet = ({ spreadsheetId, requests, accessToken }) => {
  if (!spreadsheetId) throw new Error('spreadsheetId is required');
  if (!Array.isArray(requests) || requests.length === 0) throw new Error('requests are required');

  const token = accessToken ?? getGoogleAccessToken();
  const response = run('curl', [
    '--silent', '--show-error', '--fail',
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    '-H', `Authorization: Bearer ${token}`,
    '-H', 'Content-Type: application/json',
    '--data', JSON.stringify({ requests }),
  ]);

  return JSON.parse(response);
};
