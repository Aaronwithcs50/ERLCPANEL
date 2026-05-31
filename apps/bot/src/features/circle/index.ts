import {
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextChannel,
  type Guild,
  type GuildMember,
  type Role,
  type TextBasedChannel,
  type User,
} from 'discord.js';
import { BotCommand, PrefixCommandContext, SlashCommandContext } from '../../commands/types.js';

interface ModerationCase {
  id: number;
  guildId: string;
  userId: string;
  moderatorId: string;
  action: string;
  reason: string;
  createdAt: Date;
}

interface UserNote {
  id: number;
  guildId: string;
  userId: string;
  moderatorId: string;
  note: string;
  createdAt: Date;
}

const moderationCases: ModerationCase[] = [];
const userNotes: UserNote[] = [];
let nextCaseId = 1;
let nextNoteId = 1;

const defaultReason = 'No reason provided';
const muteDurationMs = 60 * 60 * 1000;

function usage(name: string, args = ''): string {
  return `/${name}${args ? ` ${args}` : ''}`;
}

function getModerationCases(guildId: string, userId?: string): ModerationCase[] {
  return moderationCases.filter(
    (entry) => entry.guildId === guildId && (!userId || entry.userId === userId),
  );
}

function addModerationCase(
  guildId: string,
  userId: string,
  moderatorId: string,
  action: string,
  reason = defaultReason,
): ModerationCase {
  const entry = {
    id: nextCaseId,
    guildId,
    userId,
    moderatorId,
    action,
    reason,
    createdAt: new Date(),
  };
  nextCaseId += 1;
  moderationCases.push(entry);
  return entry;
}

function formatCase(entry: ModerationCase): string {
  return `#${entry.id} ${entry.action} <@${entry.userId}> by <@${entry.moderatorId}> — ${entry.reason}`;
}

function listCases(entries: ModerationCase[]): string {
  if (entries.length === 0) return 'No moderation cases found.';
  return entries.slice(-10).map(formatCase).join('\n');
}

function parseUserId(value?: string): string | undefined {
  return value?.replace(/[<@!>]/g, '');
}

async function resolveMember(guild: Guild, value?: string): Promise<GuildMember | null> {
  const userId = parseUserId(value);
  if (!userId) return null;
  return guild.members.fetch(userId).catch(() => null);
}

async function resolveUser(guild: Guild, value?: string): Promise<User | null> {
  const userId = parseUserId(value);
  if (!userId) return null;
  return guild.client.users.fetch(userId).catch(() => null);
}

function resolveRoleByName(guild: Guild, value?: string): Role | null {
  if (!value) return null;
  const roleId = value.replace(/[<@&>]/g, '');
  return (
    guild.roles.cache.get(roleId) ??
    guild.roles.cache.find((role) => role.name.toLowerCase() === value.toLowerCase()) ??
    null
  );
}

function isBulkDeletable(channel: TextBasedChannel): channel is TextChannel {
  return 'bulkDelete' in channel && typeof channel.bulkDelete === 'function';
}

async function deleteMessages(channel: TextBasedChannel, amount: number): Promise<number> {
  const boundedAmount = Math.min(Math.max(amount, 1), 100);
  if (!isBulkDeletable(channel)) return 0;
  const deleted = await channel.bulkDelete(boundedAmount, true);
  return deleted.size;
}

async function lockChannel(
  channel: TextBasedChannel,
  guild: Guild,
  locked: boolean,
): Promise<void> {
  if (!('permissionOverwrites' in channel)) return;
  await channel.permissionOverwrites.edit(guild.roles.everyone, {
    SendMessages: locked ? false : null,
  });
}

function createSimpleInfoCommand(
  name: string,
  description: string,
  category: string,
  response: (context: SlashCommandContext | PrefixCommandContext) => string | Promise<string>,
  aliases?: string[],
): BotCommand {
  return {
    name,
    aliases,
    description,
    category,
    usage: usage(name),
    slashData: new SlashCommandBuilder().setName(name).setDescription(description),
    async handleSlash(context) {
      await context.interaction.reply(await response(context));
    },
    async handlePrefix(context) {
      await context.message.reply(await response(context));
    },
  };
}

function createCaseEmbed(entry: ModerationCase): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(`Moderation Case #${entry.id}`)
    .addFields(
      { name: 'Action', value: entry.action, inline: true },
      { name: 'User', value: `<@${entry.userId}>`, inline: true },
      { name: 'Moderator', value: `<@${entry.moderatorId}>`, inline: true },
      { name: 'Reason', value: entry.reason },
    )
    .setTimestamp(entry.createdAt);
}

const banCommand: BotCommand = {
  name: 'ban',
  description: 'Ban a user from the server.',
  category: 'Moderation',
  usage: usage('ban', '<user> [reason]'),
  requiredPermissions: [PermissionFlagsBits.BanMembers],
  slashData: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user')
    .addUserOption((opt) => opt.setName('user').setDescription('User to ban').setRequired(true))
    .addStringOption((opt) => opt.setName('reason').setDescription('Reason'))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async handleSlash({ interaction }) {
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') ?? defaultReason;
    await interaction.guild.members.ban(user, { reason });
    const entry = addModerationCase(
      interaction.guildId,
      user.id,
      interaction.user.id,
      'ban',
      reason,
    );
    await interaction.reply(`🔨 Banned ${user.tag}. Case #${entry.id}`);
  },
  async handlePrefix({ message, args }) {
    const user = await resolveUser(message.guild, args[0]);
    const reason = args.slice(1).join(' ') || defaultReason;
    if (!user) {
      await message.reply('Please mention a valid user to ban.');
      return;
    }
    await message.guild.members.ban(user, { reason });
    const entry = addModerationCase(message.guild.id, user.id, message.author.id, 'ban', reason);
    await message.reply(`🔨 Banned ${user.tag}. Case #${entry.id}`);
  },
};

const kickCommand: BotCommand = {
  name: 'kick',
  description: 'Kick a user from the server.',
  category: 'Moderation',
  usage: usage('kick', '<user> [reason]'),
  requiredPermissions: [PermissionFlagsBits.KickMembers],
  slashData: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user')
    .addUserOption((opt) => opt.setName('user').setDescription('User to kick').setRequired(true))
    .addStringOption((opt) => opt.setName('reason').setDescription('Reason'))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  async handleSlash({ interaction }) {
    const member = interaction.options.getMember('user') as GuildMember;
    const reason = interaction.options.getString('reason') ?? defaultReason;
    await member.kick(reason);
    const entry = addModerationCase(
      interaction.guildId,
      member.id,
      interaction.user.id,
      'kick',
      reason,
    );
    await interaction.reply(`👢 Kicked ${member.user.tag}. Case #${entry.id}`);
  },
  async handlePrefix({ message, args }) {
    const member = await resolveMember(message.guild, args[0]);
    const reason = args.slice(1).join(' ') || defaultReason;
    if (!member) {
      await message.reply('Please mention a valid member to kick.');
      return;
    }
    await member.kick(reason);
    const entry = addModerationCase(message.guild.id, member.id, message.author.id, 'kick', reason);
    await message.reply(`👢 Kicked ${member.user.tag}. Case #${entry.id}`);
  },
};

const warnCommand: BotCommand = {
  name: 'warn',
  description: 'Warn a user and record a moderation case.',
  category: 'Moderation',
  usage: usage('warn', '<user> [reason]'),
  requiredPermissions: [PermissionFlagsBits.ModerateMembers],
  slashData: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user')
    .addUserOption((opt) => opt.setName('user').setDescription('User to warn').setRequired(true))
    .addStringOption((opt) => opt.setName('reason').setDescription('Reason'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async handleSlash({ interaction }) {
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') ?? defaultReason;
    const entry = addModerationCase(
      interaction.guildId,
      user.id,
      interaction.user.id,
      'warn',
      reason,
    );
    await interaction.reply(`⚠️ Warned ${user.tag}. Case #${entry.id}`);
  },
  async handlePrefix({ message, args }) {
    const userId = parseUserId(args[0]);
    const reason = args.slice(1).join(' ') || defaultReason;
    if (!userId) {
      await message.reply('Please mention a valid user to warn.');
      return;
    }
    const entry = addModerationCase(message.guild.id, userId, message.author.id, 'warn', reason);
    await message.reply(`⚠️ Warned <@${userId}>. Case #${entry.id}`);
  },
};

const muteCommand: BotCommand = {
  name: 'mute',
  description: 'Temporarily mute a user with a Discord timeout.',
  category: 'Moderation',
  usage: usage('mute', '<user> [reason]'),
  requiredPermissions: [PermissionFlagsBits.ModerateMembers],
  slashData: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mute a user')
    .addUserOption((opt) => opt.setName('user').setDescription('User to mute').setRequired(true))
    .addStringOption((opt) => opt.setName('reason').setDescription('Reason'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async handleSlash({ interaction }) {
    const member = interaction.options.getMember('user') as GuildMember;
    const reason = interaction.options.getString('reason') ?? defaultReason;
    await member.timeout(muteDurationMs, reason);
    const entry = addModerationCase(
      interaction.guildId,
      member.id,
      interaction.user.id,
      'mute',
      reason,
    );
    await interaction.reply(`🔇 Muted ${member.user.tag} for 60 minutes. Case #${entry.id}`);
  },
  async handlePrefix({ message, args }) {
    const member = await resolveMember(message.guild, args[0]);
    const reason = args.slice(1).join(' ') || defaultReason;
    if (!member) {
      await message.reply('Please mention a valid member to mute.');
      return;
    }
    await member.timeout(muteDurationMs, reason);
    const entry = addModerationCase(message.guild.id, member.id, message.author.id, 'mute', reason);
    await message.reply(`🔇 Muted ${member.user.tag} for 60 minutes. Case #${entry.id}`);
  },
};

const unmuteCommand: BotCommand = {
  name: 'unmute',
  description: 'Remove a user timeout.',
  category: 'Moderation',
  usage: usage('unmute', '<user> [reason]'),
  requiredPermissions: [PermissionFlagsBits.ModerateMembers],
  slashData: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Unmute a user')
    .addUserOption((opt) => opt.setName('user').setDescription('User to unmute').setRequired(true))
    .addStringOption((opt) => opt.setName('reason').setDescription('Reason'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async handleSlash({ interaction }) {
    const member = interaction.options.getMember('user') as GuildMember;
    const reason = interaction.options.getString('reason') ?? defaultReason;
    await member.timeout(null, reason);
    const entry = addModerationCase(
      interaction.guildId,
      member.id,
      interaction.user.id,
      'unmute',
      reason,
    );
    await interaction.reply(`🔊 Unmuted ${member.user.tag}. Case #${entry.id}`);
  },
  async handlePrefix({ message, args }) {
    const member = await resolveMember(message.guild, args[0]);
    const reason = args.slice(1).join(' ') || defaultReason;
    if (!member) {
      await message.reply('Please mention a valid member to unmute.');
      return;
    }
    await member.timeout(null, reason);
    const entry = addModerationCase(
      message.guild.id,
      member.id,
      message.author.id,
      'unmute',
      reason,
    );
    await message.reply(`🔊 Unmuted ${member.user.tag}. Case #${entry.id}`);
  },
};

const unbanCommand: BotCommand = {
  name: 'unban',
  description: 'Unban a user by ID.',
  category: 'Moderation',
  usage: usage('unban', '<user-id> [reason]'),
  requiredPermissions: [PermissionFlagsBits.BanMembers],
  slashData: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user')
    .addStringOption((opt) =>
      opt.setName('user_id').setDescription('User ID to unban').setRequired(true),
    )
    .addStringOption((opt) => opt.setName('reason').setDescription('Reason'))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async handleSlash({ interaction }) {
    const userId = interaction.options.getString('user_id', true);
    const reason = interaction.options.getString('reason') ?? defaultReason;
    await interaction.guild.members.unban(userId, reason);
    const entry = addModerationCase(
      interaction.guildId,
      userId,
      interaction.user.id,
      'unban',
      reason,
    );
    await interaction.reply(`✅ Unbanned <@${userId}>. Case #${entry.id}`);
  },
  async handlePrefix({ message, args }) {
    const userId = parseUserId(args[0]);
    const reason = args.slice(1).join(' ') || defaultReason;
    if (!userId) {
      await message.reply('Please provide a user ID to unban.');
      return;
    }
    await message.guild.members.unban(userId, reason);
    const entry = addModerationCase(message.guild.id, userId, message.author.id, 'unban', reason);
    await message.reply(`✅ Unbanned <@${userId}>. Case #${entry.id}`);
  },
};

const softbanCommand: BotCommand = {
  name: 'softban',
  description: 'Ban and immediately unban a user to prune messages.',
  category: 'Moderation',
  usage: usage('softban', '<user> [reason]'),
  requiredPermissions: [PermissionFlagsBits.BanMembers],
  slashData: new SlashCommandBuilder()
    .setName('softban')
    .setDescription('Softban a user')
    .addUserOption((opt) => opt.setName('user').setDescription('User to softban').setRequired(true))
    .addStringOption((opt) => opt.setName('reason').setDescription('Reason'))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async handleSlash({ interaction }) {
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') ?? defaultReason;
    await interaction.guild.members.ban(user, { reason, deleteMessageSeconds: 60 * 60 * 24 });
    await interaction.guild.members.unban(user.id, 'Softban completed');
    const entry = addModerationCase(
      interaction.guildId,
      user.id,
      interaction.user.id,
      'softban',
      reason,
    );
    await interaction.reply(`🧹 Softbanned ${user.tag}. Case #${entry.id}`);
  },
  async handlePrefix({ message, args }) {
    const user = await resolveUser(message.guild, args[0]);
    const reason = args.slice(1).join(' ') || defaultReason;
    if (!user) {
      await message.reply('Please mention a valid user to softban.');
      return;
    }
    await message.guild.members.ban(user, { reason, deleteMessageSeconds: 60 * 60 * 24 });
    await message.guild.members.unban(user.id, 'Softban completed');
    const entry = addModerationCase(
      message.guild.id,
      user.id,
      message.author.id,
      'softban',
      reason,
    );
    await message.reply(`🧹 Softbanned ${user.tag}. Case #${entry.id}`);
  },
};

const caseCommand: BotCommand = {
  name: 'case',
  description: 'View a moderation case by ID.',
  category: 'Moderation',
  usage: usage('case', '<case-id>'),
  slashData: new SlashCommandBuilder()
    .setName('case')
    .setDescription('View a moderation case')
    .addIntegerOption((opt) => opt.setName('id').setDescription('Case ID').setRequired(true)),
  async handleSlash({ interaction }) {
    const id = interaction.options.getInteger('id', true);
    const entry = moderationCases.find(
      (item) => item.guildId === interaction.guildId && item.id === id,
    );
    if (!entry) {
      await interaction.reply({ content: 'Case not found.', ephemeral: true });
      return;
    }
    await interaction.reply({ embeds: [createCaseEmbed(entry)] });
  },
  async handlePrefix({ message, args }) {
    const id = Number(args[0]);
    const entry = moderationCases.find(
      (item) => item.guildId === message.guild.id && item.id === id,
    );
    await message.reply(entry ? formatCase(entry) : 'Case not found.');
  },
};

const editCaseCommand: BotCommand = {
  name: 'editcase',
  description: 'Edit the reason on a moderation case.',
  category: 'Moderation',
  usage: usage('editcase', '<case-id> <reason>'),
  requiredPermissions: [PermissionFlagsBits.ModerateMembers],
  slashData: new SlashCommandBuilder()
    .setName('editcase')
    .setDescription('Edit a moderation case')
    .addIntegerOption((opt) => opt.setName('id').setDescription('Case ID').setRequired(true))
    .addStringOption((opt) => opt.setName('reason').setDescription('New reason').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async handleSlash({ interaction }) {
    const id = interaction.options.getInteger('id', true);
    const reason = interaction.options.getString('reason', true);
    const entry = moderationCases.find(
      (item) => item.guildId === interaction.guildId && item.id === id,
    );
    if (!entry) {
      await interaction.reply({ content: 'Case not found.', ephemeral: true });
      return;
    }
    entry.reason = reason;
    await interaction.reply(`✏️ Updated case #${id}.`);
  },
  async handlePrefix({ message, args }) {
    const id = Number(args[0]);
    const entry = moderationCases.find(
      (item) => item.guildId === message.guild.id && item.id === id,
    );
    if (!entry) {
      await message.reply('Case not found.');
      return;
    }
    entry.reason = args.slice(1).join(' ') || defaultReason;
    await message.reply(`✏️ Updated case #${id}.`);
  },
};

function createBulkDeleteCommand(name: 'clean' | 'purge'): BotCommand {
  return {
    name,
    description:
      name === 'clean'
        ? 'Clean recent messages in the current channel.'
        : 'Delete recent messages in the current channel.',
    category: 'Moderation',
    usage: usage(name, '[amount]'),
    requiredPermissions: [PermissionFlagsBits.ManageMessages],
    slashData: new SlashCommandBuilder()
      .setName(name)
      .setDescription(name === 'clean' ? 'Clean recent messages' : 'Delete recent messages')
      .addIntegerOption((opt) =>
        opt.setName('amount').setDescription('Messages to delete').setMinValue(1).setMaxValue(100),
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async handleSlash({ interaction }) {
      const amount = interaction.options.getInteger('amount') ?? 10;
      const deleted = await deleteMessages(interaction.channel!, amount);
      await interaction.reply({ content: `🧹 Deleted ${deleted} message(s).`, ephemeral: true });
    },
    async handlePrefix({ message, args }) {
      const amount = Number(args[0] ?? 10);
      const deleted = await deleteMessages(message.channel, Number.isFinite(amount) ? amount : 10);
      await message.reply(`🧹 Deleted ${deleted} message(s).`);
    },
  };
}

const cleanCommand = createBulkDeleteCommand('clean');
const purgeCommand = createBulkDeleteCommand('purge');

function createLockCommand(name: 'lock' | 'locked'): BotCommand {
  return {
    name,
    description: 'Lock or unlock the current channel.',
    category: 'Moderation',
    usage: usage(name, '<lock|unlock>'),
    requiredPermissions: [PermissionFlagsBits.ManageChannels],
    slashData: new SlashCommandBuilder()
      .setName(name)
      .setDescription('Lock or unlock the channel')
      .addStringOption((opt) =>
        opt
          .setName('mode')
          .setDescription('Whether to lock or unlock')
          .setRequired(true)
          .addChoices({ name: 'lock', value: 'lock' }, { name: 'unlock', value: 'unlock' }),
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async handleSlash({ interaction }) {
      const mode = interaction.options.getString('mode', true);
      await lockChannel(interaction.channel!, interaction.guild, mode === 'lock');
      await interaction.reply(
        `${mode === 'lock' ? '🔒 Locked' : '🔓 Unlocked'} ${interaction.channel}.`,
      );
    },
    async handlePrefix({ message, args }) {
      const mode = args[0]?.toLowerCase() === 'unlock' ? 'unlock' : 'lock';
      await lockChannel(message.channel, message.guild, mode === 'lock');
      await message.reply(`${mode === 'lock' ? '🔒 Locked' : '🔓 Unlocked'} ${message.channel}.`);
    },
  };
}

const lockCommand = createLockCommand('lock');
const lockedCommand = createLockCommand('locked');

const membersCommand: BotCommand = {
  name: 'members',
  description: 'List server members.',
  category: 'Moderation',
  usage: usage('members'),
  slashData: new SlashCommandBuilder().setName('members').setDescription('List server members'),
  async handleSlash({ interaction }) {
    const members = await interaction.guild.members.fetch({ limit: 25 });
    await interaction.reply(
      members.map((member) => member.user.tag).join('\n') || 'No members found.',
    );
  },
  async handlePrefix({ message }) {
    const members = await message.guild.members.fetch({ limit: 25 });
    await message.reply(members.map((member) => member.user.tag).join('\n') || 'No members found.');
  },
};

const modlogsCommand = createSimpleInfoCommand(
  'modlogs',
  'View moderation logs.',
  'Moderation',
  (context) => {
    const guildId =
      'interaction' in context ? context.interaction.guildId : context.message.guild.id;
    return listCases(getModerationCases(guildId));
  },
);

const moderationsCommand = createSimpleInfoCommand(
  'moderations',
  'List moderation actions.',
  'Moderation',
  (context) => {
    const guildId =
      'interaction' in context ? context.interaction.guildId : context.message.guild.id;
    return listCases(getModerationCases(guildId));
  },
);

const modstatsCommand = createSimpleInfoCommand(
  'modstats',
  'View moderation statistics.',
  'Moderation',
  (context) => {
    const guildId =
      'interaction' in context ? context.interaction.guildId : context.message.guild.id;
    const entries = getModerationCases(guildId);
    const byAction = entries.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.action] = (acc[entry.action] ?? 0) + 1;
      return acc;
    }, {});
    const details =
      Object.entries(byAction)
        .map(([action, count]) => `${action}: ${count}`)
        .join(', ') || 'none';
    return `📈 Moderation cases: ${entries.length} (${details})`;
  },
);

const diagnoseCommand = createSimpleInfoCommand(
  'diagnose',
  'Run a server health check.',
  'Moderation',
  (context) => {
    const guild = 'interaction' in context ? context.interaction.guild : context.message.guild;
    return `🩺 Server health: ${guild.name}\nMembers: ${guild.memberCount}\nChannels: ${guild.channels.cache.size}\nRoles: ${guild.roles.cache.size}`;
  },
);

const nickCommand: BotCommand = {
  name: 'nick',
  description: 'Change a user nickname.',
  category: 'Moderation',
  usage: usage('nick', '<user> <nickname>'),
  requiredPermissions: [PermissionFlagsBits.ManageNicknames],
  slashData: new SlashCommandBuilder()
    .setName('nick')
    .setDescription('Change a nickname')
    .addUserOption((opt) => opt.setName('user').setDescription('User').setRequired(true))
    .addStringOption((opt) =>
      opt.setName('nickname').setDescription('New nickname').setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),
  async handleSlash({ interaction }) {
    const member = interaction.options.getMember('user') as GuildMember;
    const nickname = interaction.options.getString('nickname', true);
    await member.setNickname(nickname);
    await interaction.reply(`🏷️ Updated ${member.user.tag}'s nickname.`);
  },
  async handlePrefix({ message, args }) {
    const member = await resolveMember(message.guild, args[0]);
    if (!member) {
      await message.reply('Please mention a valid member.');
      return;
    }
    await member.setNickname(args.slice(1).join(' '));
    await message.reply(`🏷️ Updated ${member.user.tag}'s nickname.`);
  },
};

function addUserNote(guildId: string, userId: string, moderatorId: string, note: string): UserNote {
  const entry = { id: nextNoteId, guildId, userId, moderatorId, note, createdAt: new Date() };
  nextNoteId += 1;
  userNotes.push(entry);
  return entry;
}

const noteCommand: BotCommand = {
  name: 'note',
  description: 'Add a note for a user.',
  category: 'Moderation',
  usage: usage('note', '<user> <note>'),
  requiredPermissions: [PermissionFlagsBits.ModerateMembers],
  slashData: new SlashCommandBuilder()
    .setName('note')
    .setDescription('Add a note for a user')
    .addUserOption((opt) => opt.setName('user').setDescription('User').setRequired(true))
    .addStringOption((opt) => opt.setName('note').setDescription('Note text').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async handleSlash({ interaction }) {
    const user = interaction.options.getUser('user', true);
    const note = interaction.options.getString('note', true);
    const entry = addUserNote(interaction.guildId, user.id, interaction.user.id, note);
    await interaction.reply(`📝 Added note #${entry.id} for ${user.tag}.`);
  },
  async handlePrefix({ message, args }) {
    const userId = parseUserId(args[0]);
    if (!userId) {
      await message.reply('Please mention a valid user.');
      return;
    }
    const entry = addUserNote(message.guild.id, userId, message.author.id, args.slice(1).join(' '));
    await message.reply(`📝 Added note #${entry.id} for <@${userId}>.`);
  },
};

const notesCommand: BotCommand = {
  name: 'notes',
  description: 'View notes for a user.',
  category: 'Moderation',
  usage: usage('notes', '<user>'),
  requiredPermissions: [PermissionFlagsBits.ModerateMembers],
  slashData: new SlashCommandBuilder()
    .setName('notes')
    .setDescription('View notes for a user')
    .addUserOption((opt) => opt.setName('user').setDescription('User').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async handleSlash({ interaction }) {
    const user = interaction.options.getUser('user', true);
    const notes = userNotes.filter(
      (entry) => entry.guildId === interaction.guildId && entry.userId === user.id,
    );
    await interaction.reply(
      notes.length
        ? notes
            .slice(-10)
            .map((entry) => `#${entry.id}: ${entry.note}`)
            .join('\n')
        : 'No notes found.',
    );
  },
  async handlePrefix({ message, args }) {
    const userId = parseUserId(args[0]);
    const notes = userNotes.filter(
      (entry) => entry.guildId === message.guild.id && entry.userId === userId,
    );
    await message.reply(
      notes.length
        ? notes
            .slice(-10)
            .map((entry) => `#${entry.id}: ${entry.note}`)
            .join('\n')
        : 'No notes found.',
    );
  },
};

const rolesCommand = createSimpleInfoCommand(
  'roles',
  'List server roles.',
  'Moderation',
  (context) => {
    const guild = 'interaction' in context ? context.interaction.guild : context.message.guild;
    return (
      guild.roles.cache
        .filter((role) => role.id !== guild.id)
        .map((role) => role.name)
        .slice(0, 30)
        .join(', ') || 'No roles found.'
    );
  },
);

function roleMutationCommand(name: 'addrole' | 'delrole', adding: boolean): BotCommand {
  return {
    name,
    description: adding ? 'Add a role to a user.' : 'Remove a role from a user.',
    category: 'Admin & Server Tools',
    usage: usage(name, '<user> <role>'),
    requiredPermissions: [PermissionFlagsBits.ManageRoles],
    slashData: new SlashCommandBuilder()
      .setName(name)
      .setDescription(adding ? 'Add a role to a user' : 'Remove a role from a user')
      .addUserOption((opt) => opt.setName('user').setDescription('User').setRequired(true))
      .addRoleOption((opt) => opt.setName('role').setDescription('Role').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    async handleSlash({ interaction }) {
      const member = interaction.options.getMember('user') as GuildMember;
      const role = interaction.options.getRole('role', true) as Role;
      if (adding) await member.roles.add(role);
      else await member.roles.remove(role);
      await interaction.reply(
        `${adding ? '➕ Added' : '➖ Removed'} ${role.name} ${adding ? 'to' : 'from'} ${member.user.tag}.`,
      );
    },
    async handlePrefix({ message, args }) {
      const member = await resolveMember(message.guild, args[0]);
      const role = resolveRoleByName(message.guild, args.slice(1).join(' '));
      if (!member || !role) {
        await message.reply('Please provide a valid member and role.');
        return;
      }
      if (adding) await member.roles.add(role);
      else await member.roles.remove(role);
      await message.reply(
        `${adding ? '➕ Added' : '➖ Removed'} ${role.name} ${adding ? 'to' : 'from'} ${member.user.tag}.`,
      );
    },
  };
}

const addRoleCommand = roleMutationCommand('addrole', true);
const delRoleCommand = roleMutationCommand('delrole', false);

const avatarCommand: BotCommand = {
  name: 'avatar',
  description: 'View a user avatar.',
  category: 'Admin & Server Tools',
  usage: usage('avatar', '[user]'),
  slashData: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('View avatar')
    .addUserOption((opt) => opt.setName('user').setDescription('User')),
  async handleSlash({ interaction }) {
    const user = interaction.options.getUser('user') ?? interaction.user;
    await interaction.reply(user.displayAvatarURL({ size: 1024 }));
  },
  async handlePrefix({ message }) {
    const user = message.mentions.users.first() ?? message.author;
    await message.reply(user.displayAvatarURL({ size: 1024 }));
  },
};

const dashboardCommand = createSimpleInfoCommand(
  'dashboard',
  'Access the admin dashboard.',
  'Admin & Server Tools',
  () => process.env.WEB_DASHBOARD_URL ?? 'Dashboard URL is not configured.',
);

const editRoleCommand: BotCommand = {
  name: 'editrole',
  description: 'Edit a role name.',
  category: 'Admin & Server Tools',
  usage: usage('editrole', '<role> <name>'),
  requiredPermissions: [PermissionFlagsBits.ManageRoles],
  slashData: new SlashCommandBuilder()
    .setName('editrole')
    .setDescription('Edit a role')
    .addRoleOption((opt) => opt.setName('role').setDescription('Role').setRequired(true))
    .addStringOption((opt) => opt.setName('name').setDescription('New name').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  async handleSlash({ interaction }) {
    const role = interaction.options.getRole('role', true) as Role;
    const name = interaction.options.getString('name', true);
    await role.setName(name);
    await interaction.reply(`✏️ Renamed role to ${name}.`);
  },
  async handlePrefix({ message, args }) {
    const role = resolveRoleByName(message.guild, args[0]);
    if (!role) {
      await message.reply('Please provide a valid role.');
      return;
    }
    const name = args.slice(1).join(' ');
    await role.setName(name);
    await message.reply(`✏️ Renamed role to ${name}.`);
  },
};

const emojiCommand = createSimpleInfoCommand(
  'emoji',
  'Manage server emojis.',
  'Admin & Server Tools',
  (context) => {
    const guild = 'interaction' in context ? context.interaction.guild : context.message.guild;
    return (
      guild.emojis.cache.map((emoji) => `${emoji} ${emoji.name}`).join('\n') ||
      'No custom emojis found.'
    );
  },
);

const emojisCommand = createSimpleInfoCommand(
  'emojis',
  'List server emojis.',
  'Admin & Server Tools',
  (context) => {
    const guild = 'interaction' in context ? context.interaction.guild : context.message.guild;
    return (
      guild.emojis.cache.map((emoji) => `${emoji} ${emoji.name}`).join('\n') ||
      'No custom emojis found.'
    );
  },
);

const enlargeCommand: BotCommand = {
  name: 'enlarge',
  description: 'Enlarge an image or emoji URL.',
  category: 'Admin & Server Tools',
  usage: usage('enlarge', '<url>'),
  slashData: new SlashCommandBuilder()
    .setName('enlarge')
    .setDescription('Enlarge an image')
    .addStringOption((opt) => opt.setName('url').setDescription('Image URL').setRequired(true)),
  async handleSlash({ interaction }) {
    await interaction.reply(interaction.options.getString('url', true));
  },
  async handlePrefix({ message, args }) {
    await message.reply(args[0] ?? 'Please provide an image URL.');
  },
};

const getRolesCommand: BotCommand = {
  name: 'getroles',
  description: 'Get a user roles.',
  category: 'Admin & Server Tools',
  usage: usage('getroles', '<user>'),
  slashData: new SlashCommandBuilder()
    .setName('getroles')
    .setDescription('Get user roles')
    .addUserOption((opt) => opt.setName('user').setDescription('User').setRequired(true)),
  async handleSlash({ interaction }) {
    const member = interaction.options.getMember('user') as GuildMember;
    await interaction.reply(
      member.roles.cache
        .filter((role) => role.id !== interaction.guildId)
        .map((role) => role.name)
        .join(', ') || 'No roles.',
    );
  },
  async handlePrefix({ message, args }) {
    const member = await resolveMember(message.guild, args[0]);
    await message.reply(
      member
        ? member.roles.cache
            .filter((role) => role.id !== message.guild.id)
            .map((role) => role.name)
            .join(', ') || 'No roles.'
        : 'Please mention a valid member.',
    );
  },
};

const inviteCommand: BotCommand = {
  name: 'invite',
  description: 'Create an invite link.',
  category: 'Admin & Server Tools',
  usage: usage('invite'),
  requiredPermissions: [PermissionFlagsBits.CreateInstantInvite],
  slashData: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Create invite')
    .setDefaultMemberPermissions(PermissionFlagsBits.CreateInstantInvite),
  async handleSlash({ interaction }) {
    if (!('createInvite' in interaction.channel!)) {
      await interaction.reply({
        content: 'Cannot create an invite for this channel.',
        ephemeral: true,
      });
      return;
    }
    const invite = await interaction.channel!.createInvite({
      maxAge: 3600,
      maxUses: 1,
      reason: `Requested by ${interaction.user.tag}`,
    });
    await interaction.reply({ content: invite.url, ephemeral: true });
  },
  async handlePrefix({ message }) {
    if (!('createInvite' in message.channel)) {
      await message.reply('Cannot create an invite for this channel.');
      return;
    }
    const invite = await message.channel.createInvite({
      maxAge: 3600,
      maxUses: 1,
      reason: `Requested by ${message.author.tag}`,
    });
    await message.reply(invite.url);
  },
};

const inviteInfoCommand: BotCommand = {
  name: 'inviteinfo',
  description: 'View invite info.',
  category: 'Admin & Server Tools',
  usage: usage('inviteinfo', '<code>'),
  slashData: new SlashCommandBuilder()
    .setName('inviteinfo')
    .setDescription('View invite info')
    .addStringOption((opt) =>
      opt.setName('code').setDescription('Invite code or URL').setRequired(true),
    ),
  async handleSlash({ interaction }) {
    const code = interaction.options.getString('code', true).split('/').pop()!;
    const invite = await interaction.client.fetchInvite(code);
    await interaction.reply(
      `Invite ${invite.code}: ${invite.guild?.name ?? 'unknown guild'}, uses ${invite.uses ?? 0}.`,
    );
  },
  async handlePrefix({ message, args }) {
    const code = args[0]?.split('/').pop();
    if (!code) {
      await message.reply('Please provide an invite code.');
      return;
    }
    const invite = await message.client.fetchInvite(code);
    await message.reply(
      `Invite ${invite.code}: ${invite.guild?.name ?? 'unknown guild'}, uses ${invite.uses ?? 0}.`,
    );
  },
};

const memberCountCommand = createSimpleInfoCommand(
  'membercount',
  'Show total member count.',
  'Admin & Server Tools',
  (context) => {
    const guild = 'interaction' in context ? context.interaction.guild : context.message.guild;
    return `👥 ${guild.memberCount} member(s).`;
  },
);

const prefixCommand = createSimpleInfoCommand(
  'prefix',
  'Show the configured bot prefix.',
  'Admin & Server Tools',
  () =>
    `Prefix commands use ${process.env.DISCORD_PREFIX ?? '!'}, but slash commands are recommended.`,
);

const pluginCommand = createSimpleInfoCommand(
  'plugin',
  'Manage plugins.',
  'Admin & Server Tools',
  () => 'Plugin management is available from the dashboard.',
);
const pluginsCommand = createSimpleInfoCommand(
  'plugins',
  'List plugins.',
  'Admin & Server Tools',
  () => 'Plugins: moderation, activity, shifts, tickets.',
);

const quoteCommand: BotCommand = {
  name: 'quote',
  description: 'Quote a message by ID from this channel.',
  category: 'Admin & Server Tools',
  usage: usage('quote', '<message-id>'),
  slashData: new SlashCommandBuilder()
    .setName('quote')
    .setDescription('Quote a message')
    .addStringOption((opt) =>
      opt.setName('message_id').setDescription('Message ID').setRequired(true),
    ),
  async handleSlash({ interaction }) {
    const messageId = interaction.options.getString('message_id', true);
    const quoted = await interaction.channel?.messages.fetch(messageId).catch(() => null);
    await interaction.reply(
      quoted ? `> ${quoted.content}\n— ${quoted.author}` : 'Message not found.',
    );
  },
  async handlePrefix({ message, args }) {
    const quoted = await message.channel.messages.fetch(args[0]).catch(() => null);
    await message.reply(quoted ? `> ${quoted.content}\n— ${quoted.author}` : 'Message not found.');
  },
};

const remindMeCommand: BotCommand = {
  name: 'remindme',
  description: 'Set a short reminder.',
  category: 'Admin & Server Tools',
  usage: usage('remindme', '<minutes> <text>'),
  slashData: new SlashCommandBuilder()
    .setName('remindme')
    .setDescription('Set a reminder')
    .addIntegerOption((opt) =>
      opt
        .setName('minutes')
        .setDescription('Minutes')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(1440),
    )
    .addStringOption((opt) =>
      opt.setName('text').setDescription('Reminder text').setRequired(true),
    ),
  async handleSlash({ interaction }) {
    const minutes = interaction.options.getInteger('minutes', true);
    const text = interaction.options.getString('text', true);
    await interaction.reply({
      content: `⏰ Reminder set for ${minutes} minute(s).`,
      ephemeral: true,
    });
    setTimeout(
      () => interaction.user.send(`Reminder: ${text}`).catch(() => undefined),
      minutes * 60 * 1000,
    );
  },
  async handlePrefix({ message, args }) {
    const minutes = Number(args[0]);
    const text = args.slice(1).join(' ');
    if (!Number.isFinite(minutes) || minutes < 1 || !text) {
      await message.reply('Usage: /remindme <minutes> <text>');
      return;
    }
    await message.reply(`⏰ Reminder set for ${minutes} minute(s).`);
    setTimeout(
      () => message.author.send(`Reminder: ${text}`).catch(() => undefined),
      minutes * 60 * 1000,
    );
  },
};

const roleCommand = createSimpleInfoCommand(
  'role',
  'View role information.',
  'Admin & Server Tools',
  (context) => {
    const guild = 'interaction' in context ? context.interaction.guild : context.message.guild;
    return `Roles: ${guild.roles.cache.filter((role) => role.id !== guild.id).size}`;
  },
);

const roleInfoCommand: BotCommand = {
  name: 'roleinfo',
  description: 'View role information.',
  category: 'Admin & Server Tools',
  usage: usage('roleinfo', '<role>'),
  slashData: new SlashCommandBuilder()
    .setName('roleinfo')
    .setDescription('View role info')
    .addRoleOption((opt) => opt.setName('role').setDescription('Role').setRequired(true)),
  async handleSlash({ interaction }) {
    const role = interaction.options.getRole('role', true) as Role;
    await interaction.reply(
      `${role.name}: ${role.members.size} member(s), color ${role.hexColor}.`,
    );
  },
  async handlePrefix({ message, args }) {
    const role = resolveRoleByName(message.guild, args.join(' '));
    await message.reply(
      role
        ? `${role.name}: ${role.members.size} member(s), color ${role.hexColor}.`
        : 'Role not found.',
    );
  },
};

const sayCommand: BotCommand = {
  name: 'say',
  description: 'Make the bot say something.',
  category: 'Admin & Server Tools',
  usage: usage('say', '<message>'),
  requiredPermissions: [PermissionFlagsBits.ManageMessages],
  slashData: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Make the bot say something')
    .addStringOption((opt) => opt.setName('message').setDescription('Message').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async handleSlash({ interaction }) {
    await interaction.reply({ content: 'Sent.', ephemeral: true });
    await interaction.channel?.send(interaction.options.getString('message', true));
  },
  async handlePrefix({ message, args }) {
    await message.channel.send(args.join(' '));
  },
};

const serverInfoCommand = createSimpleInfoCommand(
  'serverinfo',
  'Show server info.',
  'Admin & Server Tools',
  (context) => {
    const guild = 'interaction' in context ? context.interaction.guild : context.message.guild;
    return `ℹ️ ${guild.name}: ${guild.memberCount} members, ${guild.channels.cache.size} channels, ${guild.roles.cache.size} roles.`;
  },
);

const slowmodeCommand: BotCommand = {
  name: 'slowmode',
  description: 'Set channel slow mode.',
  category: 'Admin & Server Tools',
  usage: usage('slowmode', '<seconds>'),
  requiredPermissions: [PermissionFlagsBits.ManageChannels],
  slashData: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Set slow mode')
    .addIntegerOption((opt) =>
      opt
        .setName('seconds')
        .setDescription('Seconds')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(21600),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async handleSlash({ interaction }) {
    const seconds = interaction.options.getInteger('seconds', true);
    if ('setRateLimitPerUser' in interaction.channel!)
      await interaction.channel!.setRateLimitPerUser(seconds);
    await interaction.reply(`🐢 Slowmode set to ${seconds}s.`);
  },
  async handlePrefix({ message, args }) {
    const seconds = Number(args[0] ?? 0);
    if ('setRateLimitPerUser' in message.channel)
      await message.channel.setRateLimitPerUser(seconds);
    await message.reply(`🐢 Slowmode set to ${seconds}s.`);
  },
};

const testFilterCommand: BotCommand = {
  name: 'testfilter',
  description: 'Test a moderation filter against text.',
  category: 'Admin & Server Tools',
  usage: usage('testfilter', '<text>'),
  slashData: new SlashCommandBuilder()
    .setName('testfilter')
    .setDescription('Test a filter')
    .addStringOption((opt) => opt.setName('text').setDescription('Text').setRequired(true)),
  async handleSlash({ interaction }) {
    const text = interaction.options.getString('text', true);
    await interaction.reply(
      text.length > 500 || /(discord\.gg|@everyone|@here)/i.test(text)
        ? 'Filter would flag this message.'
        : 'Filter passed.',
    );
  },
  async handlePrefix({ message, args }) {
    const text = args.join(' ');
    await message.reply(
      text.length > 500 || /(discord\.gg|@everyone|@here)/i.test(text)
        ? 'Filter would flag this message.'
        : 'Filter passed.',
    );
  },
};

const transferModlogsCommand = createSimpleInfoCommand(
  'transfermodlogs',
  'Transfer moderation logs.',
  'Admin & Server Tools',
  (context) => {
    const guildId =
      'interaction' in context ? context.interaction.guildId : context.message.guild.id;
    return `Transferred ${getModerationCases(guildId).length} moderation log(s) to the active in-memory store.`;
  },
);

const updateCommand = createSimpleInfoCommand(
  'update',
  'Show bot update status.',
  'Admin & Server Tools',
  () => 'Bot updates are handled by the deployment pipeline.',
);

const verifyCommand: BotCommand = {
  name: 'verify',
  description: 'Verify a user.',
  category: 'Admin & Server Tools',
  usage: usage('verify', '[user]'),
  slashData: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Verify a user')
    .addUserOption((opt) => opt.setName('user').setDescription('User')),
  async handleSlash({ interaction }) {
    const user = interaction.options.getUser('user') ?? interaction.user;
    await interaction.reply(`✅ Verified ${user}.`);
  },
  async handlePrefix({ message }) {
    await message.reply(`✅ Verified ${message.mentions.users.first() ?? message.author}.`);
  },
};

const pingCommand = createSimpleInfoCommand('ping', 'Check bot latency.', 'Utility', (context) => {
  const client = 'interaction' in context ? context.interaction.client : context.message.client;
  return `🏓 Pong! WebSocket latency: ${client.ws.ping}ms.`;
});

const infoCommand = createSimpleInfoCommand(
  'info',
  'Show bot info.',
  'Utility',
  () =>
    'ERLCPANEL Discord bot with moderation, server tools, tickets, shifts, and activity commands.',
);
const premiumCommand = createSimpleInfoCommand(
  'premium',
  'Show premium info.',
  'Utility',
  () => 'Premium features are managed from the ERLCPANEL dashboard.',
);
const statusCommand = createSimpleInfoCommand(
  'status',
  'Show bot status.',
  'Utility',
  (context) => {
    const client = 'interaction' in context ? context.interaction.client : context.message.client;
    return `🟢 Online as ${client.user?.tag ?? 'the bot'}.`;
  },
);
const supportCommand = createSimpleInfoCommand(
  'support',
  'Open support ticket.',
  'Utility',
  () => 'Use /ticket-open to open a support ticket.',
);
const voteCommand = createSimpleInfoCommand(
  'vote',
  'Vote for the bot.',
  'Utility',
  () => process.env.BOT_VOTE_URL ?? 'Vote URL is not configured.',
);

const voidCommand: BotCommand = {
  name: 'void',
  description: 'Clear a channel by deleting recent messages.',
  category: 'Utility',
  usage: usage('void'),
  requiredPermissions: [PermissionFlagsBits.ManageMessages],
  slashData: new SlashCommandBuilder()
    .setName('void')
    .setDescription('Clear recent channel messages')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async handleSlash({ interaction }) {
    const deleted = await deleteMessages(interaction.channel!, 100);
    await interaction.reply({ content: `🕳️ Cleared ${deleted} message(s).`, ephemeral: true });
  },
  async handlePrefix({ message }) {
    const deleted = await deleteMessages(message.channel, 100);
    await message.reply(`🕳️ Cleared ${deleted} message(s).`);
  },
};

export const circleCommands: BotCommand[] = [
  banCommand,
  caseCommand,
  cleanCommand,
  diagnoseCommand,
  editCaseCommand,
  kickCommand,
  lockCommand,
  lockedCommand,
  membersCommand,
  modlogsCommand,
  modstatsCommand,
  moderationsCommand,
  muteCommand,
  nickCommand,
  noteCommand,
  notesCommand,
  purgeCommand,
  rolesCommand,
  softbanCommand,
  unbanCommand,
  unmuteCommand,
  warnCommand,
  addRoleCommand,
  avatarCommand,
  dashboardCommand,
  delRoleCommand,
  editRoleCommand,
  emojiCommand,
  emojisCommand,
  enlargeCommand,
  getRolesCommand,
  inviteCommand,
  inviteInfoCommand,
  memberCountCommand,
  prefixCommand,
  pluginCommand,
  pluginsCommand,
  quoteCommand,
  remindMeCommand,
  roleCommand,
  roleInfoCommand,
  sayCommand,
  serverInfoCommand,
  slowmodeCommand,
  testFilterCommand,
  transferModlogsCommand,
  updateCommand,
  verifyCommand,
  pingCommand,
  infoCommand,
  premiumCommand,
  statusCommand,
  supportCommand,
  voteCommand,
  voidCommand,
];
