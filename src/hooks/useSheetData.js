import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchTextWithRetry } from '../data/sheets';

const CACHE_PREFIX = 'awl-cache:';
const TIMESTAMP_PREFIX = 'awl-cache-time:';

const readCache = (cacheKey) => {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${cacheKey}`);
    const time = localStorage.getItem(`${TIMESTAMP_PREFIX}${cacheKey}`);
    if (!raw) return null;
    return { raw, cachedAt: time ? Number(time) : null };
  } catch {
    return null;
  }
};

const writeCache = (cacheKey, raw) => {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${cacheKey}`, raw);
    localStorage.setItem(`${TIMESTAMP_PREFIX}${cacheKey}`, String(Date.now()));
  } catch {
    // ignore storage issues
  }
};

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return isOnline;
};

export const useSheetData = ({ url, cacheKey, parser, fallbackData }) => {
  const [data, setData] = useState(fallbackData ?? null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isStale, setIsStale] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const isOnline = useOnlineStatus();

  const load = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    const cached = readCache(cacheKey);
    if (cached && !silent) {
      try {
        setData(parser(cached.raw));
        setLastUpdated(cached.cachedAt);
        setIsStale(true);
      } catch {
        // ignore bad cache
      }
    }

    try {
      const raw = await fetchTextWithRetry(url);
      const parsed = parser(raw);
      setData(parsed);
      setError(null);
      setIsStale(false);
      setLastUpdated(Date.now());
      writeCache(cacheKey, raw);
    } catch (err) {
      if (!cached) setError(isOnline ? 'Unable to load live data right now.' : 'You appear to be offline.');
      else setError(isOnline ? 'Showing last saved data while live refresh is unavailable.' : 'Offline — showing last saved data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cacheKey, isOnline, parser, url]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (isOnline) load({ silent: true });
  }, [isOnline, load]);

  return useMemo(() => ({
    data,
    loading,
    refreshing,
    error,
    isStale,
    lastUpdated,
    isOnline,
    reload: () => load({ silent: true }),
  }), [data, loading, refreshing, error, isStale, lastUpdated, isOnline, load]);
};
