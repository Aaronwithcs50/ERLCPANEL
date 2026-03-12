import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BotCommand } from '../../apps/bot/src/commands/types.js';
import { CooldownManager } from '../../apps/bot/src/middleware/cooldowns.js';

function createCommand(name: string, cooldownSeconds: number): BotCommand {
  return {
    name,
    description: 'test',
    category: 'test',
    usage: 'test',
    cooldownSeconds,
  };
}

describe('CooldownManager cleanup', () => {
  const envSnapshot = { ...process.env };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
    process.env.BOT_COOLDOWN_TTL_MULTIPLIER = '1';
    process.env.BOT_COOLDOWN_CLEANUP_INTERVAL_MS = '1';
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env = { ...envSnapshot };
  });

  it('prunes expired command keys when marking new usage', () => {
    const manager = new CooldownManager();

    manager.markUsed('user-1', createCommand('ping', 1));
    expect(manager.getTrackedKeyCount()).toBe(1);

    vi.advanceTimersByTime(1_500);

    manager.markUsed('user-2', createCommand('pong', 2));

    expect(manager.getRemainingSeconds('user-1', createCommand('ping', 1))).toBe(0);
    expect(manager.getTrackedKeyCount()).toBe(1);
  });
});
