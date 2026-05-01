import { getStore } from "@netlify/blobs";
import webpush from "web-push";

export default async function handler(req, _context) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Verify admin API key
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return new Response('Unauthorized', { status: 401 });
  }

  webpush.setVapidDetails(
    'mailto:chad.supers@cognition.ai',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  try {
    const body = await req.json();
    const payload = JSON.stringify({
      title: body.title || 'AWL Leaderboard Update',
      body: body.body || 'New scores are in! Check the leaderboard.',
    });

    const store = getStore("push-subscriptions");
    const { blobs } = await store.list();

    let sent = 0;
    let failed = 0;

    for (const blob of blobs) {
      const raw = await store.get(blob.key);
      try {
        const subscription = JSON.parse(raw);
        await webpush.sendNotification(subscription, payload);
        sent++;
      } catch (err) {
        console.error(`Failed to send to ${blob.key}:`, err.statusCode || err.message);
        // If subscription is expired/invalid (410 or 404), remove it
        if (err.statusCode === 410 || err.statusCode === 404) {
          await store.delete(blob.key);
        }
        failed++;
      }
    }

    return new Response(JSON.stringify({ sent, failed, total: blobs.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Send notification error:', err);
    return new Response('Server error', { status: 500 });
  }
}

export const config = {
  path: "/api/send-notification"
};
