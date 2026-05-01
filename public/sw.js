self.addEventListener('push', function (event) {
  let data = { title: 'AWL Leaderboard Update', body: 'New scores are in!' };
  try {
    data = event.data.json();
  } catch (_e) {
    // use defaults
  }

  const options = {
    body: data.body || 'New scores are in!',
    icon: '/sun-icon2.png',
    badge: '/sun-icon2.png',
    data: {
      url: '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'AWL Leaderboard Update', options)
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(urlToOpen);
    })
  );
});

self.addEventListener('install', function (_event) {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(clients.claim());
});
