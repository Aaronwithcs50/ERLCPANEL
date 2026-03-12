import 'dotenv/config';

const environment = process.env.APP_ENV ?? 'development';

console.log(`[bot] starting Discord bot in ${environment} mode`);
import {
  ChatInputCommandInteraction,
  Client,
  GatewayIntentBits,
  GuildMember,
  Interaction,
  Message,
  Partials,
} from "discord.js";
import { CommandRegistry } from "./commands/registry.js";
import { createHelpCommand } from "./commands/help.js";
import { CooldownManager } from "./middleware/cooldowns.js";
import { hasCommandAccess } from "./middleware/rbac.js";
import { DiscordAuditHook } from "./middleware/auditHooks.js";
import { DiscordIntegrationSettingsService } from "./services/discordIntegrationSettingsService.js";
import { moderationCommands } from "./features/moderation/index.js";
import { shiftsCommands } from "./features/shifts/index.js";
import { activityCommands } from "./features/activity/index.js";
import { ticketCommands } from "./features/tickets/index.js";

const token = process.env.DISCORD_TOKEN;
const applicationId = process.env.DISCORD_APPLICATION_ID;
const guildId = process.env.DISCORD_GUILD_ID;
const prefix = process.env.DISCORD_PREFIX ?? "!";

if (!token) {
  throw new Error("Missing DISCORD_TOKEN");
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
if (process.env.DISCORD_AUDIT_CHANNEL_ID) {
  settings.setAuditChannelId(process.env.DISCORD_AUDIT_CHANNEL_ID);
}
if (process.env.DISCORD_EVENT_CHANNEL_ID) {
  settings.setEventChannelId(process.env.DISCORD_EVENT_CHANNEL_ID);
}

const registry = new CommandRegistry();
registry.registerMany(moderationCommands);
registry.registerMany(shiftsCommands);
registry.registerMany(activityCommands);
registry.registerMany(ticketCommands);
registry.register(createHelpCommand(registry));

const cooldowns = new CooldownManager();
const audit = new DiscordAuditHook(client, settings);

client.once("ready", async () => {
  if (applicationId) {
    await registry.registerSlashCommands(token, applicationId, guildId);
    console.log(`Registered slash commands for ${guildId ? "guild" : "global"} scope.`);
  }
  console.log(`Logged in as ${client.user?.tag}`);
});

client.on("interactionCreate", async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand() || !interaction.inCachedGuild()) return;

  await executeSlashCommand(interaction);
});

client.on("messageCreate", async (message: Message) => {
  if (message.author.bot || !message.inGuild() || !message.content.startsWith(prefix)) return;

  const [rawName, ...args] = message.content.slice(prefix.length).trim().split(/\s+/);
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
    await audit.onDenied(message.author.id, command, `Cooldown ${remaining}s`, "prefix");
    return;
  }

  cooldowns.markUsed(message.author.id, command);
  await command.handlePrefix({ message, args, settings });
  await audit.onAllowed(message.author.id, command, "prefix");
});

async function executeSlashCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const command = registry.getByName(interaction.commandName);
  if (!command?.handleSlash) return;

  const member = interaction.member;
  if (!(member instanceof GuildMember)) return;

  if (!(await runGuards(member, interaction.user.id, command.name, interaction))) {
    return;
  }

  const remaining = cooldowns.getRemainingSeconds(interaction.user.id, command);
  if (remaining > 0) {
    await interaction.reply({ content: `Please wait ${remaining}s before reusing this command.`, ephemeral: true });
    await audit.onDenied(interaction.user.id, command, `Cooldown ${remaining}s`, "slash");
    return;
  }

  cooldowns.markUsed(interaction.user.id, command);
  await command.handleSlash({ interaction, settings });
  await audit.onAllowed(interaction.user.id, command, "slash");
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
      await interaction.reply({ content: "You do not have permission to use this command.", ephemeral: true });
    }
    await audit.onDenied(userId, command, "RBAC", interaction ? "slash" : "prefix");
    return false;
  }

  return true;
}

client.login(token);
