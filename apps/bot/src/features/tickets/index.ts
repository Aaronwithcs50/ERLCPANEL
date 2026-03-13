import { SlashCommandBuilder } from 'discord.js';
import { BotCommand } from '../../commands/types.js';

const ticketOpen: BotCommand = {
  name: 'ticket-open',
  description: 'Open a support ticket.',
  category: 'Tickets',
  usage: '/ticket-open <topic> | !ticket-open <topic>',
  slashData: new SlashCommandBuilder()
    .setName('ticket-open')
    .setDescription('Open a support ticket')
    .addStringOption((opt) =>
      opt.setName('topic').setDescription('Ticket topic').setRequired(true),
    ),
  async handleSlash({ interaction }) {
    const topic = interaction.options.getString('topic', true);
    await interaction.reply(`🎫 Ticket opened: ${topic}`);
  },
  async handlePrefix({ message, args }) {
    await message.reply(`🎫 Ticket opened: ${args.join(' ') || 'No topic'}`);
  },
};

const ticketClose: BotCommand = {
  name: 'ticket-close',
  description: 'Close a support ticket.',
  category: 'Tickets',
  usage: '/ticket-close <id> | !ticket-close <id>',
  slashData: new SlashCommandBuilder()
    .setName('ticket-close')
    .setDescription('Close a support ticket')
    .addStringOption((opt) => opt.setName('id').setDescription('Ticket id').setRequired(true)),
  async handleSlash({ interaction }) {
    const ticketId = interaction.options.getString('id', true);
    await interaction.reply(`✅ Ticket ${ticketId} closed.`);
  },
  async handlePrefix({ message, args }) {
    await message.reply(`✅ Ticket ${args[0] ?? 'unknown'} closed.`);
  },
};

export const ticketCommands: BotCommand[] = [ticketOpen, ticketClose];
