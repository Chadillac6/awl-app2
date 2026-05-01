const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerAndSubscribe() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push notifications not supported in this browser.');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered:', registration.scope);

    // Wait for the service worker to be ready
    const ready = await navigator.serviceWorker.ready;

    // Check existing subscription
    let subscription = await ready.pushManager.getSubscription();

    if (!subscription) {
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission denied.');
        return;
      }

      // Subscribe
      subscription = await ready.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    // Send subscription to backend
    await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    });

    console.log('Push subscription sent to server.');
  } catch (err) {
    console.error('Push subscription failed:', err);
  }
}
