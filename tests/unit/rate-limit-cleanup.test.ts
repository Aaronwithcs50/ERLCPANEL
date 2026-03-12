import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('rateLimitMiddleware cleanup', () => {
  const envSnapshot = { ...process.env };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
    process.env.API_RATE_LIMIT_WINDOW_MS = '1000';
    process.env.API_RATE_LIMIT_MAX = '2';
    process.env.API_RATE_LIMIT_STALE_WINDOW_MULTIPLIER = '1';
    process.env.API_RATE_LIMIT_CLEANUP_INTERVAL_MS = '100';
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env = { ...envSnapshot };
  });

  it('evicts stale buckets during periodic cleanup', async () => {
    const mod = await import('../../apps/api/src/middleware/rateLimit.js?cleanup=' + Date.now());
    const { rateLimitMiddleware, __rateLimitTesting } = mod;

    const next = vi.fn();

    const createRes = () => ({
      setHeader: vi.fn(),
    });

    rateLimitMiddleware({ ip: '1.1.1.1' }, createRes(), next);
    expect(__rateLimitTesting.hasBucket('1.1.1.1')).toBe(true);
    expect(__rateLimitTesting.getBucketCount()).toBe(1);

    vi.advanceTimersByTime(1_200);

    rateLimitMiddleware({ ip: '2.2.2.2' }, createRes(), next);

    expect(__rateLimitTesting.hasBucket('1.1.1.1')).toBe(false);
    expect(__rateLimitTesting.hasBucket('2.2.2.2')).toBe(true);
    expect(__rateLimitTesting.getBucketCount()).toBe(1);

    __rateLimitTesting.reset();
  });
});
