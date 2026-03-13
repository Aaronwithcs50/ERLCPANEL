import { describe, expect, it } from 'vitest';
import { CommandRegistry } from '../../apps/bot/src/commands/registry.js';
import type { BotCommand } from '../../apps/bot/src/commands/types.js';

function createCommand(name: string, aliases?: string[]): BotCommand {
  return {
    name,
    aliases,
    description: 'test',
    category: 'General',
    usage: '/test',
  };
}

describe('CommandRegistry', () => {
  it('resolves commands case-insensitively and trims lookup input', () => {
    const registry = new CommandRegistry();
    registry.register(createCommand('Ping', ['P']));

    expect(registry.getByName('ping')?.name).toBe('ping');
    expect(registry.getByName('  PING ')?.name).toBe('ping');
    expect(registry.getByName(' p ')?.name).toBe('ping');
  });

  it('throws when registering duplicate command names', () => {
    const registry = new CommandRegistry();
    registry.register(createCommand('warn'));

    expect(() => registry.register(createCommand(' WARN '))).toThrow(
      'Command "warn" is already registered.',
    );
  });

  it('throws when aliases conflict with existing command names', () => {
    const registry = new CommandRegistry();
    registry.register(createCommand('warn'));

    expect(() => registry.register(createCommand('ticket-open', ['warn']))).toThrow(
      'Alias "warn" conflicts with an existing command name.',
    );
  });
});
