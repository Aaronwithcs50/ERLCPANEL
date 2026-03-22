const truthyValues = new Set(['1', 'true', 'yes', 'on']);

export type BotEnvironment = Record<string, string | undefined>;

export interface BotRuntimeConfig {
  token: string;
  applicationId?: string;
  guildId?: string;
  prefix: string;
  auditChannelId?: string;
  eventChannelId?: string;
  environment: string;
  debugStartup: boolean;
  warnings: string[];
}

function readFirstDefined(env: BotEnvironment, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = env[key]?.trim();
    if (value) {
      return value;
    }
  }

  return undefined;
}

function readBoolean(env: BotEnvironment, keys: string[], defaultValue = false): boolean {
  const value = readFirstDefined(env, keys);
  if (!value) {
    return defaultValue;
  }

  return truthyValues.has(value.toLowerCase());
}

export function resolveBotConfig(env: BotEnvironment = process.env): BotRuntimeConfig {
  const warnings: string[] = [];
  const token = readFirstDefined(env, ['BOT_TOKEN', 'DISCORD_TOKEN']);

  if (!token) {
    throw new Error('Missing bot token. Set BOT_TOKEN (preferred) or DISCORD_TOKEN.');
  }

  const applicationId = readFirstDefined(env, ['BOT_CLIENT_ID', 'DISCORD_APPLICATION_ID']);
  const guildId = readFirstDefined(env, ['BOT_GUILD_ID', 'DISCORD_GUILD_ID']);
  const prefix = readFirstDefined(env, ['BOT_PREFIX', 'DISCORD_PREFIX']) ?? '!';
  const auditChannelId = readFirstDefined(env, [
    'BOT_AUDIT_CHANNEL_ID',
    'DISCORD_AUDIT_CHANNEL_ID',
  ]);
  const eventChannelId = readFirstDefined(env, [
    'BOT_EVENT_CHANNEL_ID',
    'DISCORD_EVENT_CHANNEL_ID',
  ]);
  const environment = readFirstDefined(env, ['APP_ENV', 'NODE_ENV']) ?? 'development';
  const debugStartup = readBoolean(env, ['BOT_DEBUG_STARTUP', 'DEBUG_STARTUP'], false);

  if (!applicationId) {
    warnings.push(
      'BOT_CLIENT_ID is not set; slash commands will not be auto-registered, but prefix commands still work.',
    );
  }

  if (applicationId && !guildId) {
    warnings.push(
      'BOT_GUILD_ID is not set; slash commands will be registered globally, which can take longer to appear.',
    );
  }

  return {
    token,
    applicationId,
    guildId,
    prefix,
    auditChannelId,
    eventChannelId,
    environment,
    debugStartup,
    warnings,
  };
}

export function buildStartupDiagnostics(config: BotRuntimeConfig): string[] {
  return [
    `[bot] environment=${config.environment}`,
    `[bot] prefix=${config.prefix}`,
    `[bot] slash-registration=${config.applicationId ? (config.guildId ? 'guild' : 'global') : 'disabled'}`,
    `[bot] audit-channel=${config.auditChannelId ?? 'disabled'}`,
    `[bot] event-channel=${config.eventChannelId ?? 'disabled'}`,
  ];
}
