import { describe, expect, it } from 'vitest';

import { buildStartupDiagnostics, resolveBotConfig } from '../../apps/bot/src/config.js';

describe('resolveBotConfig', () => {
  it('accepts the BOT_* env names used in the repo docs', () => {
    const config = resolveBotConfig({
      BOT_TOKEN: 'token',
      BOT_CLIENT_ID: 'client-id',
      BOT_GUILD_ID: 'guild-id',
      BOT_PREFIX: '?',
      BOT_AUDIT_CHANNEL_ID: 'audit-id',
      BOT_EVENT_CHANNEL_ID: 'event-id',
      APP_ENV: 'temp',
      BOT_DEBUG_STARTUP: 'true',
    });

    expect(config).toMatchObject({
      token: 'token',
      applicationId: 'client-id',
      guildId: 'guild-id',
      prefix: '?',
      auditChannelId: 'audit-id',
      eventChannelId: 'event-id',
      environment: 'temp',
      debugStartup: true,
    });
    expect(config.warnings).toEqual([]);
  });

  it('falls back to DISCORD_* vars and warns when only prefix mode is available', () => {
    const config = resolveBotConfig({
      DISCORD_TOKEN: 'legacy-token',
    });

    expect(config.token).toBe('legacy-token');
    expect(config.applicationId).toBeUndefined();
    expect(config.warnings).toContain(
      'BOT_CLIENT_ID is not set; slash commands will not be auto-registered, but prefix commands still work.',
    );
  });

  it('shows global registration warning when the guild id is omitted', () => {
    const config = resolveBotConfig({
      BOT_TOKEN: 'token',
      BOT_CLIENT_ID: 'client-id',
    });

    expect(config.warnings).toContain(
      'BOT_GUILD_ID is not set; slash commands will be registered globally, which can take longer to appear.',
    );
  });

  it('builds readable startup diagnostics for debugging', () => {
    const config = resolveBotConfig({
      BOT_TOKEN: 'token',
      BOT_PREFIX: '?',
      BOT_DEBUG_STARTUP: 'true',
    });

    expect(buildStartupDiagnostics(config)).toEqual([
      '[bot] environment=development',
      '[bot] prefix=?',
      '[bot] slash-registration=disabled',
      '[bot] audit-channel=disabled',
      '[bot] event-channel=disabled',
    ]);
  });
});
