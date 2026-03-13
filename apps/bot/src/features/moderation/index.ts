import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { BotCommand } from '../../commands/types.js';

const warnCommand: BotCommand = {
  name: 'warn',
  description: 'Warn a member and log it to moderation channels.',
  category: 'Moderation',
  usage: '/warn <user> <reason> | !warn @user <reason>',
  requiredPermissions: [PermissionFlagsBits.ModerateMembers],
  cooldownSeconds: 5,
  slashData: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user')
    .addUserOption((opt) => opt.setName('user').setDescription('User to warn').setRequired(true))
    .addStringOption((opt) => opt.setName('reason').setDescription('Reason').setRequired(true)),
  async handleSlash({ interaction }) {
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason', true);
    await interaction.reply(`⚠️ Warned ${user} for: ${reason}`);
  },
  async handlePrefix({ message, args }) {
    const mention = args[0];
    const reason = args.slice(1).join(' ') || 'No reason provided';
    await message.reply(`⚠️ Warned ${mention ?? 'unknown user'} for: ${reason}`);
  },
};

export const moderationCommands: BotCommand[] = [warnCommand];
