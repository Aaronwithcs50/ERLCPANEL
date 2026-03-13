import { SlashCommandBuilder } from 'discord.js';
import { BotCommand } from '../../commands/types.js';

const activityReport: BotCommand = {
  name: 'activity-report',
  description: 'Show recent moderation/activity summary.',
  category: 'Activity',
  usage: '/activity-report | !activity-report',
  slashData: new SlashCommandBuilder()
    .setName('activity-report')
    .setDescription('Get a summary of recent activity'),
  async handleSlash({ interaction }) {
    await interaction.reply('📊 Activity summary generated.');
  },
  async handlePrefix({ message }) {
    await message.reply('📊 Activity summary generated.');
  },
};

export const activityCommands: BotCommand[] = [activityReport];
