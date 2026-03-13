# @erlcpanel/db

Prisma-powered ORM package for ERLCPANEL using MongoDB.

## Commands

- `npm run build` - Generate Prisma client.
- `npm run db:push` - Push Prisma schema changes to MongoDB.
- `npm run seed` - Seed baseline guild/account/member data.
- `npm run retention` - Prune high-volume event logs using per-guild settings.

## Data retention strategy

High-volume log tables (`ActivityEvent`, `ShiftEvent`) are retained per guild via `GuildSettings.activityRetentionDays` and `GuildSettings.shiftEventRetentionDays`.

Use a scheduled runner (cron/job queue) to call:

```bash
npm run retention
```

The script deletes in batches (`BATCH_SIZE=5000`) to avoid long-running locks.
