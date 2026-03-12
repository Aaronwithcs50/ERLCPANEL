import { Client, TextChannel } from "discord.js";
import { BotCommand } from "../commands/types.js";
import { DiscordIntegrationSettingsService } from "../services/discordIntegrationSettingsService.js";

export interface AuditHook {
  onAllowed(userId: string, command: BotCommand, origin: "slash" | "prefix"): Promise<void>;
  onDenied(userId: string, command: BotCommand, reason: string, origin: "slash" | "prefix"): Promise<void>;
}

export class DiscordAuditHook implements AuditHook {
  constructor(
    private readonly client: Client,
    private readonly settings: DiscordIntegrationSettingsService,
  ) {}

  async onAllowed(userId: string, command: BotCommand, origin: "slash" | "prefix"): Promise<void> {
    await this.emit(`✅ ${origin} command **${command.name}** executed by <@${userId}>`);
  }

  async onDenied(
    userId: string,
    command: BotCommand,
    reason: string,
    origin: "slash" | "prefix",
  ): Promise<void> {
    await this.emit(`🚫 ${origin} command **${command.name}** denied for <@${userId}>: ${reason}`);
  }

  private async emit(message: string): Promise<void> {
    const channelId = this.settings.getAuditChannelId();
    if (!channelId) return;

    const channel = await this.client.channels.fetch(channelId).catch(() => null);
    if (!channel || !(channel instanceof TextChannel)) return;

    await channel.send(message);
  }
}
