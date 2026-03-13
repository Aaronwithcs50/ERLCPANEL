import type { ChatInputCommandInteraction, Message, PermissionResolvable } from 'discord.js';
import type { DiscordIntegrationSettingsService } from '../services/discordIntegrationSettingsService.js';

export interface CommandContext {
  settings: DiscordIntegrationSettingsService;
}

export interface SlashCommandContext extends CommandContext {
  interaction: ChatInputCommandInteraction;
}

export interface PrefixCommandContext extends CommandContext {
  message: Message;
  args: string[];
}

export interface BotCommand {
  name: string;
  description: string;
  category: string;
  usage: string;
  aliases?: string[];
  requiredPermissions?: PermissionResolvable[];
  requiredRoles?: string[];
  cooldownSeconds?: number;
  slashData?: { toJSON(): unknown };
  handleSlash?: (context: SlashCommandContext) => Promise<void>;
  handlePrefix?: (context: PrefixCommandContext) => Promise<void>;
}
