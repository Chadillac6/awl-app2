import { getStore } from '@netlify/blobs';
import crypto from 'node:crypto';

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json' },
});

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

export default async function handler(req) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const subscription = await req.json();
    if (!isValidSubscription(subscription)) return json({ error: 'Invalid push subscription' }, 400);

    const key = crypto.createHash('sha256').update(subscription.endpoint).digest('hex');
    const store = getStore('push-subscriptions');
    await store.setJSON(key, {
      subscription,
      createdAt: new Date().toISOString(),
      userAgent: req.headers.get('user-agent') || null,
    });

    return json({ success: true, id: key }, 201);
  } catch (error) {
    console.error('Subscribe error:', error);
    return json({ error: 'Server error' }, 500);
  }
}

export const config = { path: '/api/subscribe' };
