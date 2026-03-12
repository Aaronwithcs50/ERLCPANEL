import { SlashCommandBuilder } from "discord.js";
import { CommandRegistry } from "./registry.js";
import { BotCommand } from "./types.js";

export function createHelpCommand(registry: CommandRegistry): BotCommand {
  return {
    name: "help",
    description: "Show generated command documentation.",
    category: "General",
    usage: "/help | !help",
    slashData: new SlashCommandBuilder().setName("help").setDescription("Show command help"),
    async handleSlash({ interaction }) {
      await interaction.reply({ content: registry.buildHelpDocumentation(), ephemeral: true });
    },
    async handlePrefix({ message }) {
      await message.reply(registry.buildHelpDocumentation());
    },
  };
}
