import { SlashCommandBuilder } from "discord.js";
import { BotCommand } from "../../commands/types.js";

const shiftStart: BotCommand = {
  name: "shift-start",
  description: "Start your staff shift.",
  category: "Shifts",
  usage: "/shift-start | !shift-start",
  cooldownSeconds: 15,
  slashData: new SlashCommandBuilder().setName("shift-start").setDescription("Start your shift"),
  async handleSlash({ interaction }) {
    await interaction.reply("🟢 Shift started.");
  },
  async handlePrefix({ message }) {
    await message.reply("🟢 Shift started.");
  },
};

const shiftEnd: BotCommand = {
  name: "shift-end",
  description: "End your staff shift.",
  category: "Shifts",
  usage: "/shift-end | !shift-end",
  cooldownSeconds: 15,
  slashData: new SlashCommandBuilder().setName("shift-end").setDescription("End your shift"),
  async handleSlash({ interaction }) {
    await interaction.reply("🔴 Shift ended.");
  },
  async handlePrefix({ message }) {
    await message.reply("🔴 Shift ended.");
  },
};

export const shiftsCommands: BotCommand[] = [shiftStart, shiftEnd];
