import type { PrismaClient } from '@prisma/client';

export async function fetchActivityFeedPage(
  prisma: PrismaClient,
  guildId: string,
  take = 50,
  before?: { createdAt: Date; id: bigint },
) {
  return prisma.activityEvent.findMany({
    where: {
      guildId,
      ...(before
        ? {
            OR: [
              { createdAt: { lt: before.createdAt } },
              { createdAt: before.createdAt, id: { lt: before.id } },
            ],
          }
        : {}),
    },
    take,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });
}

export async function fetchLeaderboardTop(
  prisma: PrismaClient,
  guildId: string,
  metric: string,
  periodStart: Date,
  periodEnd: Date,
  take = 25,
) {
  return prisma.leaderboardSnapshot.findMany({
    where: { guildId, metric, periodStart, periodEnd },
    take,
    orderBy: [{ rank: 'asc' }],
  });
}

export async function fetchOpenApplications(
  prisma: PrismaClient,
  guildId: string,
  take = 50,
  before?: { createdAt: Date; id: string },
) {
  return prisma.application.findMany({
    where: {
      guildId,
      status: { in: ['SUBMITTED', 'REVIEWING'] },
      ...(before
        ? {
            OR: [
              { createdAt: { lt: before.createdAt } },
              { createdAt: before.createdAt, id: { lt: before.id } },
            ],
          }
        : {}),
    },
    take,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });
}
