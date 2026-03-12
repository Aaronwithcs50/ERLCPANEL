import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BATCH_SIZE = 5_000;

async function trimActivityEvents(guildId: string, retentionDays: number) {
  const cutoff = new Date(Date.now() - retentionDays * 86_400_000);

  while (true) {
    const rows = await prisma.activityEvent.findMany({
      where: { guildId, createdAt: { lt: cutoff } },
      select: { id: true },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: BATCH_SIZE,
    });

    if (rows.length === 0) break;

    await prisma.activityEvent.deleteMany({
      where: { id: { in: rows.map((row) => row.id) } },
    });
  }
}

async function trimShiftEvents(guildId: string, retentionDays: number) {
  const cutoff = new Date(Date.now() - retentionDays * 86_400_000);

  while (true) {
    const rows = await prisma.shiftEvent.findMany({
      where: { guildId, createdAt: { lt: cutoff } },
      select: { id: true },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: BATCH_SIZE,
    });

    if (rows.length === 0) break;

    await prisma.shiftEvent.deleteMany({
      where: { id: { in: rows.map((row) => row.id) } },
    });
  }
}

async function main() {
  const guilds = await prisma.guildSettings.findMany({
    select: {
      guildId: true,
      activityRetentionDays: true,
      shiftEventRetentionDays: true,
    },
  });

  for (const guild of guilds) {
    await trimActivityEvents(guild.guildId, guild.activityRetentionDays);
    await trimShiftEvents(guild.guildId, guild.shiftEventRetentionDays);
  }

  console.log(`Retention job complete for ${guilds.length} guild(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
