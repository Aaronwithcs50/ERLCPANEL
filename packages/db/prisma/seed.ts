import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const guild = await prisma.guild.upsert({
    where: { id: 'seed-guild' },
    update: { name: 'Seed Guild' },
    create: { id: 'seed-guild', name: 'Seed Guild' },
  });

  await prisma.guildSettings.upsert({
    where: { guildId: guild.id },
    update: {},
    create: {
      guildId: guild.id,
      timezone: 'UTC',
      locale: 'en-US',
      activityRetentionDays: 90,
      shiftEventRetentionDays: 180,
    },
  });

  const discordAccount = await prisma.discordAccount.upsert({
    where: { discordUserId: '100000000000000001' },
    update: {},
    create: {
      discordUserId: '100000000000000001',
      username: 'seed.user',
      globalName: 'Seed User',
    },
  });

  const robloxAccount = await prisma.robloxAccount.upsert({
    where: { robloxUserId: '2000000001' },
    update: {},
    create: {
      robloxUserId: '2000000001',
      username: 'SeedRoblox',
      displayName: 'Seed Roblox',
    },
  });

  const member = await prisma.member.upsert({
    where: {
      guildId_discordUserId: {
        guildId: guild.id,
        discordUserId: discordAccount.discordUserId,
      },
    },
    update: { displayName: 'Seed Member' },
    create: {
      guildId: guild.id,
      discordUserId: discordAccount.discordUserId,
      robloxUserId: robloxAccount.robloxUserId,
      displayName: 'Seed Member',
    },
  });

  await prisma.accountLink.upsert({
    where: {
      guildId_discordAccountId_robloxAccountId: {
        guildId: guild.id,
        discordAccountId: discordAccount.id,
        robloxAccountId: robloxAccount.id,
      },
    },
    update: { isPrimary: true },
    create: {
      guildId: guild.id,
      discordAccountId: discordAccount.id,
      robloxAccountId: robloxAccount.id,
      isPrimary: true,
      linkedByMemberId: member.id,
    },
  });

  console.log('Database seeded successfully.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
