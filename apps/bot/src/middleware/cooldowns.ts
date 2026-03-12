import type { BotCommand } from '../commands/types.js';

const DEFAULT_COOLDOWN_TTL_MULTIPLIER = 2;
const DEFAULT_COOLDOWN_CLEANUP_INTERVAL_MS = 60_000;

function readPositiveNumberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

type CooldownEntry = {
  usedAt: number;
  expiresAt: number;
};

export class CooldownManager {
  private readonly timestamps = new Map<string, CooldownEntry>();
  private readonly ttlMultiplier = readPositiveNumberEnv(
    'BOT_COOLDOWN_TTL_MULTIPLIER',
    DEFAULT_COOLDOWN_TTL_MULTIPLIER,
  );
  private readonly cleanupIntervalMs = readPositiveNumberEnv(
    'BOT_COOLDOWN_CLEANUP_INTERVAL_MS',
    DEFAULT_COOLDOWN_CLEANUP_INTERVAL_MS,
  );
  private lastCleanupAt = Date.now();

  private pruneExpired(now = Date.now()): void {
    for (const [key, entry] of this.timestamps.entries()) {
      if (now >= entry.expiresAt) {
        this.timestamps.delete(key);
      }
    }
  }

  private maybePrune(now: number): void {
    if (now - this.lastCleanupAt < this.cleanupIntervalMs) {
      return;
    }

    this.pruneExpired(now);
    this.lastCleanupAt = now;
  }

  getRemainingSeconds(userId: string, command: BotCommand): number {
    const cooldown = command.cooldownSeconds ?? 0;
    if (cooldown <= 0) {
      return 0;
    }

    const now = Date.now();
    this.maybePrune(now);

    const key = `${userId}:${command.name}`;
    const previous = this.timestamps.get(key);
    if (!previous) {
      return 0;
    }

    const elapsed = (now - previous.usedAt) / 1000;
    const remaining = cooldown - elapsed;

    if (remaining <= 0) {
      this.timestamps.delete(key);
      return 0;
    }

    return Math.ceil(remaining);
  }

  markUsed(userId: string, command: BotCommand): void {
    const cooldown = command.cooldownSeconds ?? 0;
    if (cooldown <= 0) {
      return;
    }

    const now = Date.now();
    this.maybePrune(now);

    const ttlSeconds = cooldown * this.ttlMultiplier;
    const expiresAt = now + ttlSeconds * 1000;

    this.timestamps.set(`${userId}:${command.name}`, {
      usedAt: now,
      expiresAt,
    });
  }

  getTrackedKeyCount(): number {
    return this.timestamps.size;
  }
}
