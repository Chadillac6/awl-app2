import { getGoogleAccessToken } from './googleAuth.js';

const GOOGLE_SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

const requestJson = async ({
  spreadsheetId,
  path,
  method = 'GET',
  body,
  accessToken,
  scopes,
  serviceAccountCredentials,
} = {}) => {
  if (!spreadsheetId) throw new Error('spreadsheetId is required');

  const token = accessToken ?? await getGoogleAccessToken({
    scopes,
    serviceAccountCredentials,
  });

  const response = await fetch(`${GOOGLE_SHEETS_BASE}/${spreadsheetId}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    throw new Error(`Google Sheets request failed: ${response.status} ${await response.text()}`);
  }

  if (response.status === 204) return null;
  return response.json();
};

export const getSpreadsheetValues = async ({ spreadsheetId, range, accessToken, scopes, serviceAccountCredentials } = {}) => {
  if (!range) throw new Error('range is required');
  return requestJson({
    spreadsheetId,
    path: `/values/${encodeURIComponent(range)}?alt=json&prettyPrint=false`,
    accessToken,
    scopes,
    serviceAccountCredentials,
  });
};
export const updateSpreadsheetValues = async ({
  spreadsheetId,
  range,
  values,
  valueInputOption = 'USER_ENTERED',
  accessToken,
  scopes,
  serviceAccountCredentials,
} = {}) => {
  if (!range) throw new Error('range is required');
  if (!Array.isArray(values)) throw new Error('values must be an array');

  return requestJson({
    spreadsheetId,
    path: `/values/${encodeURIComponent(range)}?valueInputOption=${encodeURIComponent(valueInputOption)}`,
    method: 'PUT',
    body: { values },
    accessToken,
    scopes,
    serviceAccountCredentials,
  });
};

export const batchUpdateSpreadsheet = async ({ spreadsheetId, requests, accessToken, scopes, serviceAccountCredentials }) => {
  if (!spreadsheetId) throw new Error('spreadsheetId is required');
  if (!Array.isArray(requests) || requests.length === 0) throw new Error('requests are required');

  return requestJson({
    spreadsheetId,
    path: ':batchUpdate',
    method: 'POST',
    body: { requests },
    accessToken,
    scopes,
    serviceAccountCredentials,
  });
};
