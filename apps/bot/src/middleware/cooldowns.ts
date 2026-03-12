import { BotCommand } from "../commands/types.js";

export class CooldownManager {
  private readonly timestamps = new Map<string, number>();

  getRemainingSeconds(userId: string, command: BotCommand): number {
    const cooldown = command.cooldownSeconds ?? 0;
    if (cooldown <= 0) {
      return 0;
    }

    const key = `${userId}:${command.name}`;
    const previous = this.timestamps.get(key);
    if (!previous) {
      return 0;
    }

    const elapsed = (Date.now() - previous) / 1000;
    const remaining = cooldown - elapsed;
    return remaining > 0 ? Math.ceil(remaining) : 0;
  }

  markUsed(userId: string, command: BotCommand): void {
    if ((command.cooldownSeconds ?? 0) <= 0) {
      return;
    }

    this.timestamps.set(`${userId}:${command.name}`, Date.now());
  }
}
