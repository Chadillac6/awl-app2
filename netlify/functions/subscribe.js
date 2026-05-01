import { getStore } from "@netlify/blobs";
import crypto from "crypto";

export default async function handler(req, _context) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const subscription = await req.json();

    if (!subscription || !subscription.endpoint) {
      return new Response('Invalid subscription', { status: 400 });
    }

    const store = getStore("push-subscriptions");

    const key = crypto.createHash('sha256').update(subscription.endpoint).digest('hex');

    await store.set(key, JSON.stringify(subscription));

    return new Response(JSON.stringify({ success: true }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Subscribe error:', err);
    return new Response('Server error', { status: 500 });
  }
}

export const config = {
  path: "/api/subscribe"
};
