import { getStore } from "@netlify/blobs";

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

    // Use a hash of the endpoint as the key to avoid duplicates
    const key = btoa(subscription.endpoint).replace(/[^a-zA-Z0-9]/g, '').slice(0, 64);

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
