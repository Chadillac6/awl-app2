# AWL Push Notifications

## Goal

Send a manual leaderboard-update push notification to every subscribed AWL user, especially iOS users running the installed PWA.

## Workflow

1. User installs AWL to the iPhone Home Screen.
2. User opens AWL from the Home Screen icon.
3. User taps **Enable** in the Leaderboard alerts card.
4. The browser creates a Web Push subscription.
5. Netlify stores the subscription in Netlify Blobs.
6. Chad or the bot sends a protected leaderboard-update notification.
7. Service worker displays the push and opens AWL when tapped.

## Manual send options

### Chad / admins in the Google Sheet

The AWL spreadsheet gets an **AWL Admin → Send leaderboard push** menu from Apps Script. That is the preferred manual control because only sheet admins can use it and no admin UI needs to ship in the public app.

The Apps Script stores the Netlify send endpoint and admin key in Script Properties:

- `AWL_PUSH_ENDPOINT`
- `AWL_PUSH_ADMIN_KEY`

Deploy/update the bound script:

```bash
GOG_KEYRING=file GOG_KEYRING_PASSWORD=gogclaw GOG_ACCOUNT=chad.supers@gmail.com \
node scripts/deploy-apps-script.mjs
```

Configure its secret properties:

```bash
GOG_KEYRING=file GOG_KEYRING_PASSWORD=gogclaw GOG_ACCOUNT=chad.supers@gmail.com \
AWL_APPS_SCRIPT_ID=... \
AWL_PUSH_ENDPOINT=https://amwalkingleague.netlify.app/api/send-notification \
AWL_PUSH_ADMIN_API_KEY=... \
node scripts/configure-apps-script-push.mjs
```

### Bot / CLI

```bash
AWL_APP_URL=https://amwalkingleague.netlify.app \
AWL_PUSH_ADMIN_API_KEY=... \
node scripts/send-leaderboard-notification.mjs
```

Score-ingestion scripts can also send after an apply run with `--notify` once env vars are available.

## Required Netlify env vars

Client build env:

- `VITE_VAPID_PUBLIC_KEY`

Function env:

- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT=mailto:chad.supers@gmail.com`
- `ADMIN_API_KEY`

The public VAPID key must match in `VITE_VAPID_PUBLIC_KEY` and `VAPID_PUBLIC_KEY`.

Generate VAPID keys:

```bash
npx web-push generate-vapid-keys --json
```

## End-to-end test checklist

1. Deploy to Netlify with env vars set.
2. Open the site on iPhone Safari.
3. Share → Add to Home Screen.
4. Open AWL from the Home Screen icon.
5. Go to Leaderboards.
6. Tap Enable in Leaderboard alerts.
7. Confirm subscription count by sending a manual test.
8. Lock the phone or background the app.
9. Send another test notification.
10. Tap the notification and confirm AWL opens.

## Important iOS notes

- iOS Web Push requires the PWA to be installed to Home Screen.
- Do not auto-prompt for notification permission on page load.
- Users must explicitly enable alerts from inside the app.
- Push only works over HTTPS in production.

## Security

- Subscription endpoint is public but only stores valid browser push subscriptions.
- Send endpoint requires `ADMIN_API_KEY` via `Authorization: Bearer ...`.
- The admin key is not exposed in client code.
- Expired subscriptions are deleted after 404/410 send failures.
