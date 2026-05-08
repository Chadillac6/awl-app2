const DEFAULT_TITLE = 'Leaderboard Update';
const DEFAULT_BODY = 'New scores are in. Check the leaderboard.';
const DEFAULT_TAG = 'awl-leaderboard-update';

const compactText = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

const truncate = (value, fallback, maxLength) => {
  const text = compactText(value) || compactText(fallback);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
};

const normalizeTag = (value) => {
  const cleaned = compactText(value)
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return truncate(cleaned || DEFAULT_TAG, DEFAULT_TAG, 64);
};

const normalizeUrl = (value) => {
  const text = compactText(value);
  if (text.startsWith('/') && !text.startsWith('//')) return text;
  if (text.startsWith('?') || text.startsWith('#')) return `/${text}`;
  return '/';
};

export const normalizeNotificationPayload = (value = {}) => ({
  title: truncate(value.title, DEFAULT_TITLE, 64),
  body: truncate(value.body, DEFAULT_BODY, 140),
  url: normalizeUrl(value.url),
  tag: normalizeTag(value.tag),
});

