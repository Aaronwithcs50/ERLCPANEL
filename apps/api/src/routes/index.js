import { Router } from 'express';
import { ApiToken } from '../models/apiToken.js';
import { paginate } from '../utils/pagination.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = Router();

const moderationHistory = [
  { id: 'm1', action: 'warn', moderator: 'mod_1', target: 'user_44', createdAt: '2026-01-10T10:00:00Z' },
  { id: 'm2', action: 'ban', moderator: 'mod_2', target: 'user_18', createdAt: '2026-01-11T14:15:00Z' },
  { id: 'm3', action: 'mute', moderator: 'mod_1', target: 'user_19', createdAt: '2026-01-12T18:30:00Z' }
];

const shiftEvents = [
  { id: 's1', type: 'start', userId: 'staff_1', at: '2026-01-12T09:00:00Z' },
  { id: 's2', type: 'break', userId: 'staff_1', at: '2026-01-12T12:00:00Z' },
  { id: 's3', type: 'end', userId: 'staff_1', at: '2026-01-12T17:00:00Z' }
];

const config = {
  serverId: 'server_001',
  locale: 'en-US',
  roles: {
    admin: 'role_admin',
    moderator: 'role_mod',
    trainee: 'role_trainee'
  },
  channels: {
    logs: 'channel_logs',
    shifts: 'channel_shifts',
    appeals: 'channel_appeals'
  }
};

router.get('/moderation/history', (req, res) => {
  const { data, pagination } = paginate(moderationHistory, req.query.page, req.query.limit);
  return sendSuccess(res, data, { pagination });
});

router.get('/moderation/statistics', (_req, res) => {
  const stats = moderationHistory.reduce(
    (acc, item) => {
      acc.total += 1;
      acc.byAction[item.action] = (acc.byAction[item.action] || 0) + 1;
      return acc;
    },
    { total: 0, byAction: {} }
  );
  return sendSuccess(res, stats);
});

router.get('/shifts/history', (req, res) => {
  const { data, pagination } = paginate(shiftEvents, req.query.page, req.query.limit);
  return sendSuccess(res, data, { pagination });
});

router.get('/shifts/events', (req, res) => {
  const { data, pagination } = paginate(shiftEvents, req.query.page, req.query.limit);
  return sendSuccess(res, data, { pagination });
});

router.get('/activity/summaries', (_req, res) => {
  return sendSuccess(res, {
    activeStaff: 12,
    shiftsToday: 34,
    moderationActionsToday: 9
  });
});

router.get('/activity/reports/yearly/:year', (req, res) => {
  const year = Number(req.params.year);
  if (!Number.isInteger(year) || year < 2000) {
    return sendError(res, 'INVALID_YEAR', 'Year must be a valid integer >= 2000', { status: 400 });
  }

  return sendSuccess(res, {
    year,
    totals: {
      shifts: 4300,
      moderationActions: 1200,
      incidentReports: 84
    }
  });
});

router.get('/server/configuration', (_req, res) => sendSuccess(res, config));

router.get('/server/mappings', (_req, res) => sendSuccess(res, {
  roles: config.roles,
  channels: config.channels
}));

router.post('/tokens', (req, res) => {
  const { label, scopes, ttlMs } = req.body || {};
  const { record, rawToken } = ApiToken.create({ label, scopes, ttlMs });
  return sendSuccess(res, { token: rawToken, tokenInfo: record }, { status: 201 });
});

router.delete('/tokens/:id', (req, res) => {
  const revoked = ApiToken.revoke(req.params.id);
  if (!revoked) {
    return sendError(res, 'NOT_FOUND', 'Token not found or already revoked', { status: 404 });
  }
  return sendSuccess(res, revoked);
});

router.get('/tokens', (_req, res) => sendSuccess(res, ApiToken.list()));

export default router;
