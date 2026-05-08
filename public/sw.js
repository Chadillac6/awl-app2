self.addEventListener('push', (event) => {
  let data = {
    title: 'Leaderboard Update',
    body: 'New scores are in. Check the leaderboard.',
    url: '/',
    tag: 'awl-leaderboard-update',
  };

  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (_error) {
    // Use default payload if the push body is not JSON.
  }

  const options = {
    body: data.body,
    icon: '/sun-icon2.png',
    badge: '/sun-icon2.png',
    tag: data.tag,
    renotify: true,
    data: { url: data.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = new URL(event.notification.data?.url || '/', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.navigate?.(urlToOpen);
          return client.focus();
        }
      }
      return clients.openWindow(urlToOpen);
    }),
  );
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()));
