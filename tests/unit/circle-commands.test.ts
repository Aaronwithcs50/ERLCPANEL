import { describe, expect, it } from 'vitest';
import { CommandRegistry } from '../../apps/bot/src/commands/registry.js';
import { circleCommands } from '../../apps/bot/src/features/circle/index.js';

const expectedCommandNames = [
  'ban',
  'case',
  'clean',
  'diagnose',
  'editcase',
  'kick',
  'lock',
  'locked',
  'members',
  'modlogs',
  'modstats',
  'moderations',
  'mute',
  'nick',
  'note',
  'notes',
  'purge',
  'roles',
  'softban',
  'unban',
  'unmute',
  'warn',
  'addrole',
  'avatar',
  'dashboard',
  'delrole',
  'editrole',
  'emoji',
  'emojis',
  'enlarge',
  'getroles',
  'invite',
  'inviteinfo',
  'membercount',
  'prefix',
  'plugin',
  'plugins',
  'quote',
  'remindme',
  'role',
  'roleinfo',
  'say',
  'serverinfo',
  'slowmode',
  'testfilter',
  'transfermodlogs',
  'update',
  'verify',
  'ping',
  'info',
  'premium',
  'status',
  'support',
  'vote',
  'void',
];

describe('circleCommands', () => {
  it('registers every requested slash command without c-prefix command names', () => {
    const registry = new CommandRegistry();
    registry.registerMany(circleCommands);

    expect(
      registry
        .getSlashCommands()
        .map((command) => command.name)
        .sort(),
    ).toEqual([...expectedCommandNames].sort());
    expect(registry.getSlashCommands().every((command) => !command.name.startsWith('c!'))).toBe(
      true,
    );
  });

  it('keeps command help usage slash-first', () => {
    expect(circleCommands.every((command) => command.usage.startsWith('/'))).toBe(true);
  });
});
