#!/usr/bin/env node
import crypto from 'node:crypto';
import webpush from 'web-push';

const vapid = webpush.generateVAPIDKeys();
const adminKey = crypto.randomBytes(32).toString('base64url');

console.log(JSON.stringify({
  VITE_VAPID_PUBLIC_KEY: vapid.publicKey,
  VAPID_PUBLIC_KEY: vapid.publicKey,
  VAPID_PRIVATE_KEY: vapid.privateKey,
  VAPID_SUBJECT: 'mailto:chad.supers@gmail.com',
  ADMIN_API_KEY: adminKey,
}, null, 2));
