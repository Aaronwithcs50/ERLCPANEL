-- CreateEnum
CREATE TYPE "ModerationActionType" AS ENUM ('WARN', 'MUTE', 'UNMUTE', 'KICK', 'BAN', 'UNBAN', 'NOTE');

-- CreateEnum
CREATE TYPE "ModerationTargetType" AS ENUM ('MEMBER', 'DISCORD_ACCOUNT', 'ROBLOX_ACCOUNT');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'REVIEWING', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "JoinRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "LOAStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELED');

-- CreateEnum
CREATE TYPE "ShiftEventType" AS ENUM ('START', 'END', 'BREAK_START', 'BREAK_END', 'CORRECTION');

-- CreateEnum
CREATE TYPE "ActivityEventType" AS ENUM ('COMMAND', 'MODERATION', 'SHIFT', 'APPLICATION', 'SYSTEM');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'MONITORING', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ServiceState" AS ENUM ('OPERATIONAL', 'DEGRADED', 'OUTAGE');

-- CreateTable
CREATE TABLE "Guild" (
    "id" VARCHAR(64) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guild_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "guildId" VARCHAR(64) NOT NULL,
    "discordUserId" VARCHAR(64),
    "robloxUserId" VARCHAR(64),
    "displayName" VARCHAR(255),
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscordAccount" (
    "id" TEXT NOT NULL,
    "discordUserId" VARCHAR(64) NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "globalName" VARCHAR(255),
    "avatarUrl" VARCHAR(2048),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscordAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RobloxAccount" (
    "id" TEXT NOT NULL,
    "robloxUserId" VARCHAR(64) NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "displayName" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RobloxAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountLink" (
    "id" TEXT NOT NULL,
    "guildId" VARCHAR(64) NOT NULL,
    "discordAccountId" TEXT NOT NULL,
    "robloxAccountId" TEXT NOT NULL,
    "linkedByMemberId" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unlinkedAt" TIMESTAMP(3),

    CONSTRAINT "AccountLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationAction" (
    "id" TEXT NOT NULL,
    "guildId" VARCHAR(64) NOT NULL,
    "memberId" TEXT,
    "actionType" "ModerationActionType" NOT NULL,
    "targetType" "ModerationTargetType" NOT NULL,
    "targetId" VARCHAR(64) NOT NULL,
    "reason" TEXT,
    "performedById" VARCHAR(64),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationHistory" (
    "id" TEXT NOT NULL,
    "moderationActionId" TEXT NOT NULL,
    "previousReason" TEXT,
    "newReason" TEXT,
    "changedById" VARCHAR(64),
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationStatistic" (
    "id" TEXT NOT NULL,
    "guildId" VARCHAR(64) NOT NULL,
    "memberId" VARCHAR(64) NOT NULL,
    "actionType" "ModerationActionType" NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModerationStatistic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "guildId" VARCHAR(64) NOT NULL,
    "memberId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "totalDurationSec" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftBreak" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "durationSec" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ShiftBreak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftEvent" (
    "id" TEXT NOT NULL,
    "guildId" VARCHAR(64) NOT NULL,
    "shiftId" TEXT NOT NULL,
    "eventType" "ShiftEventType" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShiftEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityEvent" (
    "id" BIGSERIAL NOT NULL,
    "guildId" VARCHAR(64) NOT NULL,
    "memberId" VARCHAR(64),
    "eventType" "ActivityEventType" NOT NULL,
    "source" VARCHAR(64) NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderboardSnapshot" (
    "id" TEXT NOT NULL,
    "guildId" VARCHAR(64) NOT NULL,
    "metric" VARCHAR(64) NOT NULL,
    "memberId" VARCHAR(64) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaderboardSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "guildId" VARCHAR(64) NOT NULL,
    "memberId" TEXT NOT NULL,
    "formKey" VARCHAR(64) NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationResponse" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "questionKey" VARCHAR(128) NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JoinRequest" (
    "id" TEXT NOT NULL,
    "guildId" VARCHAR(64) NOT NULL,
    "memberId" TEXT NOT NULL,
    "status" "JoinRequestStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "JoinRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LOARequest" (
    "id" TEXT NOT NULL,
    "guildId" VARCHAR(64) NOT NULL,
    "memberId" TEXT NOT NULL,
    "status" "LOAStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "LOARequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuildSettings" (
    "guildId" VARCHAR(64) NOT NULL,
    "locale" VARCHAR(16) NOT NULL DEFAULT 'en-US',
    "timezone" VARCHAR(64) NOT NULL DEFAULT 'UTC',
    "activityRetentionDays" INTEGER NOT NULL DEFAULT 90,
    "shiftEventRetentionDays" INTEGER NOT NULL DEFAULT 180,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuildSettings_pkey" PRIMARY KEY ("guildId")
);

-- CreateTable
CREATE TABLE "RoleMapping" (
    "id" TEXT NOT NULL,
    "guildId" VARCHAR(64) NOT NULL,
    "key" VARCHAR(64) NOT NULL,
    "roleId" VARCHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelMapping" (
    "id" TEXT NOT NULL,
    "guildId" VARCHAR(64) NOT NULL,
    "key" VARCHAR(64) NOT NULL,
    "channelId" VARCHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChannelMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "id" TEXT NOT NULL,
    "guildId" VARCHAR(64) NOT NULL,
    "key" VARCHAR(64) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "rollout" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiToken" (
    "id" TEXT NOT NULL,
    "guildId" VARCHAR(64) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "tokenHash" VARCHAR(255) NOT NULL,
    "scopes" TEXT[],
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookSubscription" (
    "id" TEXT NOT NULL,
    "guildId" VARCHAR(64) NOT NULL,
    "event" VARCHAR(64) NOT NULL,
    "endpoint" VARCHAR(2048) NOT NULL,
    "secretHash" VARCHAR(255) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastDeliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "guildId" VARCHAR(64) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceUptime" (
    "id" TEXT NOT NULL,
    "guildId" VARCHAR(64) NOT NULL,
    "serviceKey" VARCHAR(64) NOT NULL,
    "state" "ServiceState" NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responseMs" INTEGER,
    "errorCode" VARCHAR(64),

    CONSTRAINT "ServiceUptime_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Guild_createdAt_idx" ON "Guild"("createdAt");

-- CreateIndex
CREATE INDEX "Member_guildId_joinedAt_id_idx" ON "Member"("guildId", "joinedAt", "id");

-- CreateIndex
CREATE INDEX "Member_guildId_leftAt_idx" ON "Member"("guildId", "leftAt");

-- CreateIndex
CREATE UNIQUE INDEX "Member_guildId_discordUserId_key" ON "Member"("guildId", "discordUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Member_guildId_robloxUserId_key" ON "Member"("guildId", "robloxUserId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscordAccount_discordUserId_key" ON "DiscordAccount"("discordUserId");

-- CreateIndex
CREATE INDEX "DiscordAccount_username_idx" ON "DiscordAccount"("username");

-- CreateIndex
CREATE UNIQUE INDEX "RobloxAccount_robloxUserId_key" ON "RobloxAccount"("robloxUserId");

-- CreateIndex
CREATE INDEX "RobloxAccount_username_idx" ON "RobloxAccount"("username");

-- CreateIndex
CREATE INDEX "AccountLink_guildId_createdAt_id_idx" ON "AccountLink"("guildId", "createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "AccountLink_guildId_discordAccountId_robloxAccountId_key" ON "AccountLink"("guildId", "discordAccountId", "robloxAccountId");

-- CreateIndex
CREATE INDEX "ModerationAction_guildId_createdAt_id_idx" ON "ModerationAction"("guildId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "ModerationAction_guildId_targetId_createdAt_idx" ON "ModerationAction"("guildId", "targetId", "createdAt");

-- CreateIndex
CREATE INDEX "ModerationAction_guildId_actionType_createdAt_idx" ON "ModerationAction"("guildId", "actionType", "createdAt");

-- CreateIndex
CREATE INDEX "ModerationHistory_moderationActionId_changedAt_idx" ON "ModerationHistory"("moderationActionId", "changedAt");

-- CreateIndex
CREATE INDEX "ModerationStatistic_guildId_periodStart_periodEnd_idx" ON "ModerationStatistic"("guildId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "ModerationStatistic_guildId_actionType_count_idx" ON "ModerationStatistic"("guildId", "actionType", "count" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ModerationStatistic_guildId_memberId_actionType_periodStart_key" ON "ModerationStatistic"("guildId", "memberId", "actionType", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "Shift_guildId_startedAt_id_idx" ON "Shift"("guildId", "startedAt", "id");

-- CreateIndex
CREATE INDEX "Shift_guildId_memberId_startedAt_idx" ON "Shift"("guildId", "memberId", "startedAt");

-- CreateIndex
CREATE INDEX "Shift_guildId_endedAt_idx" ON "Shift"("guildId", "endedAt");

-- CreateIndex
CREATE INDEX "ShiftBreak_shiftId_startedAt_idx" ON "ShiftBreak"("shiftId", "startedAt");

-- CreateIndex
CREATE INDEX "ShiftEvent_guildId_createdAt_id_idx" ON "ShiftEvent"("guildId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "ShiftEvent_guildId_shiftId_createdAt_idx" ON "ShiftEvent"("guildId", "shiftId", "createdAt");

-- CreateIndex
CREATE INDEX "ShiftEvent_guildId_eventType_createdAt_idx" ON "ShiftEvent"("guildId", "eventType", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityEvent_guildId_createdAt_id_idx" ON "ActivityEvent"("guildId", "createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "ActivityEvent_guildId_memberId_createdAt_id_idx" ON "ActivityEvent"("guildId", "memberId", "createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "ActivityEvent_guildId_eventType_createdAt_idx" ON "ActivityEvent"("guildId", "eventType", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "LeaderboardSnapshot_guildId_metric_periodStart_periodEnd_ra_idx" ON "LeaderboardSnapshot"("guildId", "metric", "periodStart", "periodEnd", "rank");

-- CreateIndex
CREATE INDEX "LeaderboardSnapshot_guildId_metric_value_idx" ON "LeaderboardSnapshot"("guildId", "metric", "value" DESC);

-- CreateIndex
CREATE INDEX "LeaderboardSnapshot_guildId_capturedAt_idx" ON "LeaderboardSnapshot"("guildId", "capturedAt");

-- CreateIndex
CREATE INDEX "Application_guildId_status_createdAt_id_idx" ON "Application"("guildId", "status", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Application_guildId_memberId_createdAt_idx" ON "Application"("guildId", "memberId", "createdAt");

-- CreateIndex
CREATE INDEX "ApplicationResponse_applicationId_createdAt_idx" ON "ApplicationResponse"("applicationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationResponse_applicationId_questionKey_key" ON "ApplicationResponse"("applicationId", "questionKey");

-- CreateIndex
CREATE INDEX "JoinRequest_guildId_status_requestedAt_id_idx" ON "JoinRequest"("guildId", "status", "requestedAt", "id");

-- CreateIndex
CREATE INDEX "LOARequest_guildId_status_requestedAt_id_idx" ON "LOARequest"("guildId", "status", "requestedAt", "id");

-- CreateIndex
CREATE INDEX "LOARequest_guildId_startDate_endDate_idx" ON "LOARequest"("guildId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "RoleMapping_guildId_roleId_idx" ON "RoleMapping"("guildId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "RoleMapping_guildId_key_key" ON "RoleMapping"("guildId", "key");

-- CreateIndex
CREATE INDEX "ChannelMapping_guildId_channelId_idx" ON "ChannelMapping"("guildId", "channelId");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelMapping_guildId_key_key" ON "ChannelMapping"("guildId", "key");

-- CreateIndex
CREATE INDEX "FeatureFlag_guildId_enabled_idx" ON "FeatureFlag"("guildId", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_guildId_key_key" ON "FeatureFlag"("guildId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "ApiToken_tokenHash_key" ON "ApiToken"("tokenHash");

-- CreateIndex
CREATE INDEX "ApiToken_guildId_createdAt_idx" ON "ApiToken"("guildId", "createdAt");

-- CreateIndex
CREATE INDEX "ApiToken_guildId_revokedAt_idx" ON "ApiToken"("guildId", "revokedAt");

-- CreateIndex
CREATE INDEX "WebhookSubscription_guildId_event_isActive_idx" ON "WebhookSubscription"("guildId", "event", "isActive");

-- CreateIndex
CREATE INDEX "Incident_guildId_status_startedAt_idx" ON "Incident"("guildId", "status", "startedAt");

-- CreateIndex
CREATE INDEX "ServiceUptime_guildId_serviceKey_observedAt_idx" ON "ServiceUptime"("guildId", "serviceKey", "observedAt" DESC);

-- CreateIndex
CREATE INDEX "ServiceUptime_guildId_state_observedAt_idx" ON "ServiceUptime"("guildId", "state", "observedAt" DESC);

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_discordUserId_fkey" FOREIGN KEY ("discordUserId") REFERENCES "DiscordAccount"("discordUserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_robloxUserId_fkey" FOREIGN KEY ("robloxUserId") REFERENCES "RobloxAccount"("robloxUserId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountLink" ADD CONSTRAINT "AccountLink_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountLink" ADD CONSTRAINT "AccountLink_discordAccountId_fkey" FOREIGN KEY ("discordAccountId") REFERENCES "DiscordAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountLink" ADD CONSTRAINT "AccountLink_robloxAccountId_fkey" FOREIGN KEY ("robloxAccountId") REFERENCES "RobloxAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationHistory" ADD CONSTRAINT "ModerationHistory_moderationActionId_fkey" FOREIGN KEY ("moderationActionId") REFERENCES "ModerationAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationStatistic" ADD CONSTRAINT "ModerationStatistic_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftBreak" ADD CONSTRAINT "ShiftBreak_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftEvent" ADD CONSTRAINT "ShiftEvent_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftEvent" ADD CONSTRAINT "ShiftEvent_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderboardSnapshot" ADD CONSTRAINT "LeaderboardSnapshot_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationResponse" ADD CONSTRAINT "ApplicationResponse_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JoinRequest" ADD CONSTRAINT "JoinRequest_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JoinRequest" ADD CONSTRAINT "JoinRequest_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LOARequest" ADD CONSTRAINT "LOARequest_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LOARequest" ADD CONSTRAINT "LOARequest_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuildSettings" ADD CONSTRAINT "GuildSettings_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleMapping" ADD CONSTRAINT "RoleMapping_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelMapping" ADD CONSTRAINT "ChannelMapping_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureFlag" ADD CONSTRAINT "FeatureFlag_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiToken" ADD CONSTRAINT "ApiToken_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookSubscription" ADD CONSTRAINT "WebhookSubscription_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceUptime" ADD CONSTRAINT "ServiceUptime_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

