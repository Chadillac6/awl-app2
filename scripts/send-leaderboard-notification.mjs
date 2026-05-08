#!/usr/bin/env node
const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, '').split('=');
  return [key, rest.length ? rest.join('=') : true];
}));

const siteUrl = args.url || process.env.AWL_APP_URL;
const adminKey = args.key || process.env.AWL_PUSH_ADMIN_API_KEY || process.env.ADMIN_API_KEY;

if (!siteUrl) throw new Error('Missing --url or AWL_APP_URL');
if (!adminKey) throw new Error('Missing --key or AWL_PUSH_ADMIN_API_KEY');

const endpoint = new URL('/api/send-notification', siteUrl).href;
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
