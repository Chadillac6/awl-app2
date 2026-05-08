const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
};

export const getPushSupport = () => {
  const hasWindow = typeof window !== 'undefined';
  const hasNotifications = hasWindow && 'Notification' in window;
  const hasServiceWorker = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  const hasPushManager = hasWindow && 'PushManager' in window;
  const hasVapidKey = Boolean(VAPID_PUBLIC_KEY);

  return {
    supported: hasNotifications && hasServiceWorker && hasPushManager && hasVapidKey,
    installed: hasWindow ? isStandalone() : false,
    permission: hasNotifications ? Notification.permission : 'unsupported',
    hasVapidKey,
    missingReason: !hasVapidKey
      ? 'Push alerts are not configured yet.'
      : !hasNotifications || !hasServiceWorker || !hasPushManager
        ? 'Push alerts are not supported in this browser.'
        : null,
  };
};

export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) throw new Error('Service workers are not supported');
  await navigator.serviceWorker.register('/sw.js');
  return navigator.serviceWorker.ready;
};

export const subscribeToLeaderboardPush = async () => {
  const support = getPushSupport();
  if (!support.supported) throw new Error(support.missingReason || 'Push alerts are unavailable');

  const registration = await registerServiceWorker();
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') throw new Error('Notification permission was not granted');

    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const response = await fetch('/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription),
  });

  if (!response.ok) throw new Error('Could not save push subscription');
  return response.json();
};
