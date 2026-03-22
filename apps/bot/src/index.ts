import 'dotenv/config';

import {
  ChatInputCommandInteraction,
  Client,
  GatewayIntentBits,
  GuildMember,
  Interaction,
  Message,
  Partials,
} from 'discord.js';
import { CommandRegistry } from './commands/registry.js';
import { createHelpCommand } from './commands/help.js';
import { resolveBotConfig, buildStartupDiagnostics } from './config.js';
import { CooldownManager } from './middleware/cooldowns.js';
import { hasCommandAccess } from './middleware/rbac.js';
import { DiscordAuditHook } from './middleware/auditHooks.js';
import { DiscordIntegrationSettingsService } from './services/discordIntegrationSettingsService.js';
import { moderationCommands } from './features/moderation/index.js';
import { shiftsCommands } from './features/shifts/index.js';
import { activityCommands } from './features/activity/index.js';
import { ticketCommands } from './features/tickets/index.js';
import { logger } from './utils/logger.js';

const config = resolveBotConfig();

console.log(`[bot] starting Discord bot in ${config.environment} mode`);
for (const warning of config.warnings) {
  console.warn(`[bot] warning: ${warning}`);
}
if (config.debugStartup) {
  for (const line of buildStartupDiagnostics(config)) {
    console.log(line);
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel],
});

const settings = new DiscordIntegrationSettingsService();
if (config.auditChannelId) {
  settings.setAuditChannelId(config.auditChannelId);
}
if (config.eventChannelId) {
  settings.setEventChannelId(config.eventChannelId);
}

const registry = new CommandRegistry();
registry.registerMany(moderationCommands);
registry.registerMany(shiftsCommands);
registry.registerMany(activityCommands);
registry.registerMany(ticketCommands);
registry.register(createHelpCommand(registry));

const cooldowns = new CooldownManager();
const audit = new DiscordAuditHook(client, settings);

client.once('ready', async () => {
  if (config.applicationId) {
    await registry.registerSlashCommands(config.token, config.applicationId, config.guildId);
    console.log(`Registered slash commands for ${config.guildId ? 'guild' : 'global'} scope.`);
  }

  if (config.debugStartup) {
    console.log(`[bot] registered prefix commands=${registry.getPrefixCommands().length}`);
    console.log(`[bot] registered slash commands=${registry.getSlashCommands().length}`);
  }

  console.log(`Logged in as ${client.user?.tag}`);
});

client.on('interactionCreate', async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand() || !interaction.inCachedGuild()) return;

  await executeSlashCommand(interaction);
});

client.on('messageCreate', async (message: Message) => {
  if (message.author.bot || !message.inGuild() || !message.content.startsWith(config.prefix))
    return;

  const [rawName, ...args] = message.content.slice(config.prefix.length).trim().split(/\s+/);
  if (!rawName) return;

  const command = registry.getByName(rawName.toLowerCase());
  if (!command?.handlePrefix) return;

  const member = message.member;
  if (!member) return;

  if (!(await runGuards(member, message.author.id, command.name))) {
    return;
  }

  const remaining = cooldowns.getRemainingSeconds(message.author.id, command);
  if (remaining > 0) {
    await message.reply(`Please wait ${remaining}s before using this command again.`);
    await safeAuditDenied(message.author.id, command.name, `Cooldown ${remaining}s`, 'prefix');
    return;
  }

  cooldowns.markUsed(message.author.id, command);

  try {
    await command.handlePrefix({ message, args, settings });
  } catch (error) {
    logger.commandError('Prefix command execution failed', {
      commandName: command.name,
      userId: message.author.id,
      origin: 'prefix',
      error,
    });
    await message.reply('Something went wrong while running that command.');
    return;
  }

  await safeAuditAllowed(message.author.id, command.name, 'prefix');
});

async function executeSlashCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const command = registry.getByName(interaction.commandName);
  if (!command?.handleSlash) return;

  try {
    const member = interaction.member;
    if (!(member instanceof GuildMember)) return;

    if (!(await runGuards(member, interaction.user.id, command.name, interaction))) {
      return;
    }

    const remaining = cooldowns.getRemainingSeconds(interaction.user.id, command);
    if (remaining > 0) {
      await interaction.reply({
        content: `Please wait ${remaining}s before reusing this command.`,
        ephemeral: true,
      });
      await safeAuditDenied(interaction.user.id, command.name, `Cooldown ${remaining}s`, 'slash');
      return;
    }

    cooldowns.markUsed(interaction.user.id, command);
    await command.handleSlash({ interaction, settings });
    await safeAuditAllowed(interaction.user.id, command.name, 'slash');
  } catch (error) {
    logger.commandError('Slash command execution failed', {
      commandName: command.name,
      userId: interaction.user.id,
      origin: 'slash',
      error,
    });
    await replyWithSafeSlashFallback(
      interaction,
      'Something went wrong while running that command.',
    );
  }
}

async function safeAuditAllowed(
  userId: string,
  commandName: string,
  origin: 'slash' | 'prefix',
): Promise<void> {
  const command = registry.getByName(commandName);
  if (!command) return;

  try {
    await audit.onAllowed(userId, command, origin);
  } catch (error) {
    logger.commandError('Audit allow logging failed', {
      commandName,
      userId,
      origin,
      error,
    });
  }
}

async function safeAuditDenied(
  userId: string,
  commandName: string,
  reason: string,
  origin: 'slash' | 'prefix',
): Promise<void> {
  const command = registry.getByName(commandName);
  if (!command) return;

  try {
    await audit.onDenied(userId, command, reason, origin);
  } catch (error) {
    logger.commandError('Audit deny logging failed', {
      commandName,
      userId,
      origin,
      error,
    });
  }
}

async function replyWithSafeSlashFallback(
  interaction: ChatInputCommandInteraction,
  content: string,
): Promise<void> {
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp({ content, ephemeral: true });
    return;
  }

  await interaction.reply({ content, ephemeral: true });
}

async function runGuards(
  member: GuildMember,
  userId: string,
  commandName: string,
  interaction?: ChatInputCommandInteraction,
): Promise<boolean> {
  const command = registry.getByName(commandName);
  if (!command) return false;

  if (!hasCommandAccess(member, command, settings)) {
    if (interaction) {
      await interaction.reply({
        content: 'You do not have permission to use this command.',
        ephemeral: true,
      });
    }
    await safeAuditDenied(userId, command.name, 'RBAC', interaction ? 'slash' : 'prefix');
    return false;
  }

  return true;
}

client.on('error', (error) => {
  logger.error('Discord client error', { errorStack: error.stack ?? error.message });
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', {
    errorStack: reason instanceof Error ? (reason.stack ?? reason.message) : String(reason),
  });
});

client.login(config.token);
