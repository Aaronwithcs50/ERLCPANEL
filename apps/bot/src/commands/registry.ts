import { REST, Routes } from "discord.js";
import { BotCommand } from "./types.js";

export class CommandRegistry {
  private readonly commandsByName = new Map<string, BotCommand>();
  private readonly aliases = new Map<string, string>();

  register(command: BotCommand): void {
    this.commandsByName.set(command.name, command);
    for (const alias of command.aliases ?? []) {
      this.aliases.set(alias, command.name);
    }
  }

  registerMany(commands: BotCommand[]): void {
    for (const command of commands) {
      this.register(command);
    }
  }

  getByName(nameOrAlias: string): BotCommand | undefined {
    const name = this.aliases.get(nameOrAlias) ?? nameOrAlias;
    return this.commandsByName.get(name);
  }

  getAll(): BotCommand[] {
    return [...this.commandsByName.values()];
  }

  getSlashCommands(): BotCommand[] {
    return this.getAll().filter((command) => command.slashData && command.handleSlash);
  }

  getPrefixCommands(): BotCommand[] {
    return this.getAll().filter((command) => command.handlePrefix);
  }

  buildHelpDocumentation(): string {
    const grouped = this.getAll().reduce<Map<string, BotCommand[]>>((acc, command) => {
      const group = acc.get(command.category) ?? [];
      group.push(command);
      acc.set(command.category, group);
      return acc;
    }, new Map());

    return [...grouped.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([category, commands]) => {
        const body = commands
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((command) => `• **${command.name}** - ${command.description}\n  Usage: \`${command.usage}\``)
          .join("\n");
        return `## ${category}\n${body}`;
      })
      .join("\n\n");
  }

  async registerSlashCommands(token: string, applicationId: string, guildId?: string): Promise<void> {
    const payload = this.getSlashCommands().map((command) => command.slashData!.toJSON());
    const rest = new REST({ version: "10" }).setToken(token);

    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(applicationId, guildId), { body: payload });
      return;
    }

    await rest.put(Routes.applicationCommands(applicationId), { body: payload });
  }
}
