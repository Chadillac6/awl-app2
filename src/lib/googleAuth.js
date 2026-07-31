import { existsSync, readFileSync } from 'node:fs';
import { createPrivateKey, createSign } from 'node:crypto';

const DEFAULT_SERVICE_ACCOUNT_KEY = '/Users/Bot/.openclaw/credentials/summerleague-service-account.json';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const TOKEN_EXPIRY_BUFFER_MS = 60_000;
const accessTokenCache = new Map();

const base64Url = (input) => Buffer.from(input).toString('base64url');

export const loadServiceAccountCredentials = ({
  path = process.env.AWL_GOOGLE_SERVICE_ACCOUNT_KEY_PATH
    ?? process.env.GOOGLE_APPLICATION_CREDENTIALS
    ?? (existsSync(DEFAULT_SERVICE_ACCOUNT_KEY) ? DEFAULT_SERVICE_ACCOUNT_KEY : undefined),
  json = process.env.AWL_GOOGLE_SERVICE_ACCOUNT_JSON,
} = {}) => {
  const raw = json ?? (path ? readFileSync(path, 'utf8') : null);
  if (!raw) return null;

  const credentials = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!credentials.client_email || !credentials.private_key) {
    throw new Error('Service account credentials must include client_email and private_key');
  }

  return credentials;
};

export const buildServiceAccountJwtAssertion = ({
  clientEmail,
  privateKey,
  scope = [GOOGLE_SHEETS_SCOPE],
  subject,
  lifetimeSeconds = 3600,
} = {}) => {
  if (!clientEmail) throw new Error('clientEmail is required');
  if (!privateKey) throw new Error('privateKey is required');

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: clientEmail,
    scope: Array.isArray(scope) ? scope.join(' ') : String(scope),
    aud: GOOGLE_TOKEN_URL,
    iat: now,
    exp: now + lifetimeSeconds,
    ...(subject ? { sub: subject } : {}),
  };

  const unsigned = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(createPrivateKey(privateKey));
  return `${unsigned}.${base64Url(signature)}`;
};

export const getServiceAccountAccessToken = async ({
  serviceAccountCredentials,
  scope = [GOOGLE_SHEETS_SCOPE],
  subject,
} = {}) => {
  const credentials = serviceAccountCredentials ?? loadServiceAccountCredentials();
  if (!credentials) return null;

  const normalizedScope = Array.isArray(scope) ? scope.join(' ') : String(scope);
  const cacheKey = `${credentials.client_email}|${normalizedScope}|${subject ?? ''}`;
  const cached = accessTokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now() + TOKEN_EXPIRY_BUFFER_MS) return cached.token;

  const assertion = buildServiceAccountJwtAssertion({
    clientEmail: credentials.client_email,
    privateKey: credentials.private_key,
    scope: normalizedScope,
    subject,
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!response.ok) {
    throw new Error(`Service account token exchange failed: ${response.status} ${await response.text()}`);
  }

  const parsed = await response.json();
  if (!parsed.access_token) throw new Error('Service account token response did not include access_token');
  accessTokenCache.set(cacheKey, {
    token: parsed.access_token,
    expiresAt: Date.now() + ((Number(parsed.expires_in) || 3600) * 1000),
  });
  return parsed.access_token;
};

export const clearGoogleAccessTokenCache = () => accessTokenCache.clear();

export const getGoogleAccessToken = async ({
  scopes = [GOOGLE_SHEETS_SCOPE],
  serviceAccountCredentials,
} = {}) => {
  const serviceAccountToken = await getServiceAccountAccessToken({
    serviceAccountCredentials,
    scope: scopes,
  });
  if (serviceAccountToken) return serviceAccountToken;

  throw new Error(`Missing Google service account credentials. Set AWL_GOOGLE_SERVICE_ACCOUNT_KEY_PATH, GOOGLE_APPLICATION_CREDENTIALS, or AWL_GOOGLE_SERVICE_ACCOUNT_JSON. Default checked: ${DEFAULT_SERVICE_ACCOUNT_KEY}`);
};
