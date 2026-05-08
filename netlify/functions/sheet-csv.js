import { PUBLISHED_SHEET_CSV_URLS } from '../../src/data/sheetSources.js';

const VALID_TABS = new Set(Object.keys(PUBLISHED_SHEET_CSV_URLS));

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

export default async function handler(req) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return textResponse('Method not allowed', 405, { Allow: 'GET, HEAD' });
  }

  const tab = getRequestedTab(req);
  if (!VALID_TABS.has(tab)) {
    return textResponse('Unknown sheet tab', 404);
  }

  try {
    const upstream = await fetch(PUBLISHED_SHEET_CSV_URLS[tab], {
      headers: { Accept: 'text/csv,text/plain,*/*' },
      redirect: 'follow',
    });

    if (!upstream.ok) {
      console.error(`Sheet CSV upstream failed for ${tab}: ${upstream.status}`);
      return textResponse('Sheet data unavailable', 502);
    }

    const body = req.method === 'HEAD' ? '' : await upstream.text();
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Cache-Control': tab === 'leaderboard'
          ? 'public, max-age=15, s-maxage=15, stale-while-revalidate=60'
          : 'public, max-age=60, s-maxage=60, stale-while-revalidate=300',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error(`Sheet CSV proxy error for ${tab}:`, error);
    return textResponse('Sheet data unavailable', 502);
  }
}

export const config = { path: '/api/sheets/:tab' };
