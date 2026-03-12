import { GuildMember, PermissionFlagsBits } from "discord.js";
import { BotCommand } from "../commands/types.js";
import { DiscordIntegrationSettingsService } from "../services/discordIntegrationSettingsService.js";

export function hasCommandAccess(
  member: GuildMember,
  command: BotCommand,
  settings: DiscordIntegrationSettingsService,
): boolean {
  const permissionRequirements = command.requiredPermissions ?? [];
  if (permissionRequirements.length > 0 && !member.permissions.has(permissionRequirements)) {
    return false;
  }

  if (member.permissions.has(PermissionFlagsBits.Administrator)) {
    return true;
  }

  const configuredRoles = settings.getLinkedRolePermissions(command.name);
  const commandRoles = new Set([...(command.requiredRoles ?? []), ...configuredRoles]);
  if (commandRoles.size === 0) {
    return true;
  }

  return [...commandRoles].some((roleId) => member.roles.cache.has(roleId));
}
