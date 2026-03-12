export interface RoleSyncSettings {
  enabled: boolean;
  sourceGuildId?: string;
  mirroredRoleIds: string[];
}

export class DiscordIntegrationSettingsService {
  private auditChannelId?: string;
  private eventChannelId?: string;
  private roleSyncSettings: RoleSyncSettings = {
    enabled: false,
    mirroredRoleIds: [],
  };
  private linkedRolePermissions = new Map<string, string[]>();

  setAuditChannelId(channelId: string): void {
    this.auditChannelId = channelId;
  }

  getAuditChannelId(): string | undefined {
    return this.auditChannelId;
  }

  setEventChannelId(channelId: string): void {
    this.eventChannelId = channelId;
  }

  getEventChannelId(): string | undefined {
    return this.eventChannelId;
  }

  setRoleSyncSettings(settings: RoleSyncSettings): void {
    this.roleSyncSettings = { ...settings };
  }

  getRoleSyncSettings(): RoleSyncSettings {
    return { ...this.roleSyncSettings };
  }

  setLinkedRolePermissions(commandName: string, roleIds: string[]): void {
    this.linkedRolePermissions.set(commandName, [...roleIds]);
  }

  getLinkedRolePermissions(commandName: string): string[] {
    return this.linkedRolePermissions.get(commandName) ?? [];
  }
}
