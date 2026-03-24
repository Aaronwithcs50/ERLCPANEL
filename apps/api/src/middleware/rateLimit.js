import { sendError } from '../utils/response.js';

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_LIMIT = 120;
const DEFAULT_STALE_WINDOW_MULTIPLIER = 2;

function readNumberEnv(name, fallback) {
  const raw = process.env[name];
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const WINDOW_MS = readNumberEnv('API_RATE_LIMIT_WINDOW_MS', DEFAULT_WINDOW_MS);
const LIMIT = readNumberEnv('API_RATE_LIMIT_MAX', DEFAULT_LIMIT);
const STALE_WINDOW_MULTIPLIER = readNumberEnv(
  'API_RATE_LIMIT_STALE_WINDOW_MULTIPLIER',
  DEFAULT_STALE_WINDOW_MULTIPLIER,
);
const CLEANUP_INTERVAL_MS = readNumberEnv('API_RATE_LIMIT_CLEANUP_INTERVAL_MS', WINDOW_MS);

const buckets = new Map();
let lastCleanupAt = Date.now();

function cleanupStaleBuckets(now = Date.now()) {
  const staleAfterMs = WINDOW_MS * Math.max(1, STALE_WINDOW_MULTIPLIER);

  for (const [key, bucket] of buckets.entries()) {
    if (now - bucket.lastSeenAt >= staleAfterMs) {
      buckets.delete(key);
    }
  }
}

function maybeCleanupStaleBuckets(now) {
  if (now - lastCleanupAt < CLEANUP_INTERVAL_MS) {
    return;
  }

  cleanupStaleBuckets(now);
  lastCleanupAt = now;
}

export function rateLimitMiddleware(req, res, next) {
  const key = req.apiToken?.id || req.ip;
  const now = Date.now();
  maybeCleanupStaleBuckets(now);

  const bucket = buckets.get(key) || { count: 0, startedAt: now, lastSeenAt: now };

  if (now - bucket.startedAt >= WINDOW_MS) {
    bucket.count = 0;
    bucket.startedAt = now;
  }

  bucket.count += 1;
  bucket.lastSeenAt = now;
  buckets.set(key, bucket);

  const remaining = Math.max(0, LIMIT - bucket.count);
  const resetSeconds = Math.ceil((bucket.startedAt + WINDOW_MS - now) / 1000);

  res.setHeader('x-ratelimit-limit', LIMIT);
  res.setHeader('x-ratelimit-remaining', remaining);
  res.setHeader('x-ratelimit-reset', resetSeconds);

  if (bucket.count > LIMIT) {
    res.setHeader('retry-after', resetSeconds);
    return sendError(res, 'RATE_LIMITED', 'Rate limit exceeded. Retry later.', {
      status: 429,
      details: { retryAfterSeconds: resetSeconds },
    });
  }

  return next();
}

export const __rateLimitTesting = {
  cleanupStaleBuckets,
  getBucketCount: () => buckets.size,
  hasBucket: (key) => buckets.has(key),
  reset: () => {
    buckets.clear();
    lastCleanupAt = Date.now();
  },
};
