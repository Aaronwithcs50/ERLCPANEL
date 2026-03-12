import { sendError } from '../utils/response.js';

const WINDOW_MS = 60_000;
const LIMIT = 120;
const buckets = new Map();

export function rateLimitMiddleware(req, res, next) {
  const key = req.apiToken?.id || req.ip;
  const now = Date.now();
  const bucket = buckets.get(key) || { count: 0, startedAt: now };

  if (now - bucket.startedAt >= WINDOW_MS) {
    bucket.count = 0;
    bucket.startedAt = now;
  }

  bucket.count += 1;
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
      details: { retryAfterSeconds: resetSeconds }
    });
  }

  return next();
}
