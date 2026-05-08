import { getStore } from '@netlify/blobs';
import webpush from 'web-push';
import { normalizeNotificationPayload } from '../../src/lib/notificationPayload.js';

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json' },
});

const getAdminToken = (req) => {
  const auth = req.headers.get('authorization') || '';
  if (auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  return req.headers.get('x-api-key');
};

const assertConfig = () => {
  const missing = ['ADMIN_API_KEY', 'VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY'].filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Missing required env vars: ${missing.join(', ')}`);
};

const decodeBase64UrlLength = (value) => {
  try {
    const base64 = String(value).replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    return Buffer.from(padded, 'base64').length;
  } catch (_error) {
    return 0;
  }
};

const isValidSubscription = (subscription) => Boolean(
  subscription?.endpoint
  && typeof subscription.endpoint === 'string'
  && subscription?.keys?.p256dh
  && typeof subscription.keys.p256dh === 'string'
  && decodeBase64UrlLength(subscription.keys.p256dh) === 65
  && subscription?.keys?.auth
  && typeof subscription.keys.auth === 'string'
  && decodeBase64UrlLength(subscription.keys.auth) > 0,
);

const shouldDeleteFailedSubscription = (error) => {
  const message = String(error?.message || '');
  return error?.statusCode === 404
    || error?.statusCode === 410
    || message.includes('p256dh')
    || message.includes("must have 'auth'")
    || message.includes('subscription');
};

export default async function handler(req) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    assertConfig();
    if (getAdminToken(req) !== process.env.ADMIN_API_KEY) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json().catch(() => ({}));
    const payload = JSON.stringify(normalizeNotificationPayload(body));

    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:chad.supers@gmail.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY,
    );

    const store = getStore('push-subscriptions');
    const { blobs } = await store.list();
    let sent = 0;
    let failed = 0;
    let deleted = 0;

    for (const blob of blobs) {
      try {
        const record = await store.get(blob.key, { type: 'json' });
        const subscription = record?.subscription ?? record;

        if (!isValidSubscription(subscription)) {
          await store.delete(blob.key);
          deleted += 1;
          failed += 1;
          console.error(`Deleted invalid push subscription ${blob.key}`);
          continue;
        }

        await webpush.sendNotification(subscription, payload);
        sent += 1;
      } catch (error) {
        failed += 1;
        console.error(`Push failed for ${blob.key}:`, error.statusCode || error.message);
        if (shouldDeleteFailedSubscription(error)) {
          await store.delete(blob.key);
          deleted += 1;
        }
      }
    }

    return json({ success: true, sent, failed, deleted, total: blobs.length });
  } catch (error) {
    console.error('Send notification error:', error);
    return json({ error: error.message || 'Server error' }, error.message?.startsWith('Missing required env') ? 500 : 500);
  }
}

export const config = { path: '/api/send-notification' };
