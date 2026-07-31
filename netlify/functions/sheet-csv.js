import { getGoogleAccessToken } from '../../src/lib/googleAuth.js';
import { PUBLISHED_SHEET_CSV_URLS } from '../../src/data/sheetSources.js';

const SPREADSHEET_ID = process.env.AWL_SHEET_ID ?? '1cv3aai-DNpyw-suyUtYlLrBFvmkStD_jkUYsyEK2zoI';

const LIVE_SHEET_RANGES = {
  schedule: 'Schedule!A1:F1000',
  leaderboard: 'Leaderboards!A1:Q1000',
  stats: 'Raw!A1:CC1000',
  championship: 'Championship!A1:H1000',
};

const CACHE_TTL_MS = 15_000;
const STALE_TTL_MS = 5 * 60_000;
const UPSTREAM_TIMEOUT_MS = 8_000;
const responseCache = new Map();

const hasExplicitServiceAccountCredentials = () => Boolean(
  process.env.AWL_GOOGLE_SERVICE_ACCOUNT_JSON
    || process.env.AWL_GOOGLE_SERVICE_ACCOUNT_KEY_PATH
    || process.env.GOOGLE_APPLICATION_CREDENTIALS,
);

const VALID_TABS = new Set(Object.keys(LIVE_SHEET_RANGES));

const textResponse = (body, status = 200, extraHeaders = {}) => new Response(body, {
  status,
  headers: {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extraHeaders,
  },
});

const getRequestedTab = (req) => {
  const url = new URL(req.url);
  const pathTab = url.pathname.split('/').filter(Boolean).pop();
  return url.searchParams.get('tab') || pathTab;
};

const csvEscape = (value) => {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const valuesToCsv = (values = []) => values
  .map((row) => row.map(csvEscape).join(','))
  .join('\n');

const fetchWithTimeout = (url, options = {}) => fetch(url, {
  ...options,
  signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
});

const fetchLiveSheetCsv = async (tab) => {
  if (!hasExplicitServiceAccountCredentials()) {
    throw new Error('Live Sheets API credentials are not configured');
  }

  const range = LIVE_SHEET_RANGES[tab];
  if (!range) throw new Error(`No live sheet range configured for ${tab}`);

  const token = await getGoogleAccessToken({
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`;
  const response = await fetchWithTimeout(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Live Sheets API failed for ${tab}: ${response.status} ${await response.text()}`);
  }

  const parsed = await response.json();
  return valuesToCsv(parsed.values ?? []);
};

const fetchPublishedCsv = async (tab) => {
  if (!PUBLISHED_SHEET_CSV_URLS[tab]) {
    throw new Error(`No published CSV fallback configured for ${tab}`);
  }
  const upstream = await fetchWithTimeout(PUBLISHED_SHEET_CSV_URLS[tab], {
    headers: { Accept: 'text/csv,text/plain,*/*' },
    redirect: 'follow',
  });

  if (!upstream.ok) {
    throw new Error(`Published Sheet CSV failed for ${tab}: ${upstream.status}`);
  }

  return upstream.text();
};

export default async function handler(req) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return textResponse('Method not allowed', 405, { Allow: 'GET, HEAD' });
  }

  const tab = getRequestedTab(req);
  if (!VALID_TABS.has(tab)) {
    return textResponse('Unknown sheet tab', 404);
  }

  try {
    const cached = responseCache.get(tab);
    const age = cached ? Date.now() - cached.cachedAt : Infinity;
    if (age <= CACHE_TTL_MS) {
      return new Response(req.method === 'HEAD' ? '' : cached.body, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'X-AWL-Cache': 'HIT',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }

    let body;
    try {
      body = await fetchLiveSheetCsv(tab);
    } catch (error) {
      console.error(`Live Sheet API unavailable for ${tab}; falling back to published CSV:`, error);
      body = await fetchPublishedCsv(tab);
    }
    responseCache.set(tab, { body, cachedAt: Date.now() });

    return new Response(req.method === 'HEAD' ? '' : body, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
        'X-AWL-Cache': 'MISS',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error(`Sheet CSV proxy error for ${tab}:`, error);
    const stale = responseCache.get(tab);
    if (stale && Date.now() - stale.cachedAt <= STALE_TTL_MS) {
      return new Response(req.method === 'HEAD' ? '' : stale.body, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'X-AWL-Cache': 'STALE',
          Warning: '110 - "Response is stale"',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }
    return textResponse('Sheet data unavailable', 502);
  }
}

export const clearSheetCsvCache = () => responseCache.clear();

export const config = { path: '/api/sheets/:tab' };
