const MODULE_SCRIPT_PATTERN = /<script\b[^>]*\btype=["']module["'][^>]*>/gi;
const SRC_ATTRIBUTE_PATTERN = /\bsrc=["']([^"']+)["']/i;

export const findModuleScriptSource = (html) => {
  const scripts = String(html ?? '').match(MODULE_SCRIPT_PATTERN) ?? [];
  for (const script of scripts) {
    const source = script.match(SRC_ATTRIBUTE_PATTERN)?.[1];
    if (source) return source;
  }
  return null;
};

const absoluteUrl = (source, origin) => {
  try {
    return new URL(source, origin).href;
  } catch {
    return null;
  }
};

export const hasNewAppBundle = async ({ currentSource, origin, fetchImpl = fetch }) => {
  if (!currentSource || !origin) return false;
  const response = await fetchImpl(`/?freshness=${Date.now()}`, {
    cache: 'no-store',
    headers: { Accept: 'text/html' },
  });
  if (!response.ok) return false;

  const latestSource = findModuleScriptSource(await response.text());
  if (!latestSource) return false;
  return absoluteUrl(latestSource, origin) !== absoluteUrl(currentSource, origin);
};

export const installAppFreshnessCheck = ({ windowObj = window, documentObj = document, fetchImpl = fetch } = {}) => {
  const currentSource = documentObj.querySelector('script[type="module"][src]')?.getAttribute('src');
  if (!currentSource) return () => {};

  let checking = false;
  let lastCheckedAt = 0;
  const check = async () => {
    if (documentObj.visibilityState === 'hidden' || checking || Date.now() - lastCheckedAt < 15_000) return;
    checking = true;
    lastCheckedAt = Date.now();
    try {
      const changed = await hasNewAppBundle({
        currentSource,
        origin: windowObj.location.origin,
        fetchImpl,
      });
      if (changed) windowObj.location.reload();
    } catch {
      // A freshness check must never interrupt normal app use.
    } finally {
      checking = false;
    }
  };

  const checkWhenVisible = () => {
    if (documentObj.visibilityState !== 'hidden') check();
  };
  documentObj.addEventListener('visibilitychange', checkWhenVisible);
  windowObj.addEventListener('focus', checkWhenVisible);
  windowObj.addEventListener('pageshow', checkWhenVisible);

  return () => {
    documentObj.removeEventListener('visibilitychange', checkWhenVisible);
    windowObj.removeEventListener('focus', checkWhenVisible);
    windowObj.removeEventListener('pageshow', checkWhenVisible);
  };
};
