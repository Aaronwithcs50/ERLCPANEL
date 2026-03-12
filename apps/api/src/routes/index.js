import { Router } from 'express';
import { ApiToken } from '../models/apiToken.js';
import { configService } from '../services/configService.js';
import { moderationService } from '../services/moderationService.js';
import { BackendUnavailableError } from '../services/serviceErrors.js';
import { shiftService } from '../services/shiftService.js';
import { paginate } from '../utils/pagination.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = Router();

function validatePaginationQuery(query) {
  const page = query.page === undefined ? undefined : Number(query.page);
  const limit = query.limit === undefined ? undefined : Number(query.limit);

  if (query.page !== undefined && (!Number.isInteger(page) || page < 1)) {
    return 'Query parameter "page" must be an integer >= 1';
  }

  if (query.limit !== undefined && (!Number.isInteger(limit) || limit < 1 || limit > 100)) {
    return 'Query parameter "limit" must be an integer between 1 and 100';
  }

  return null;
}

function validateModerationQuery(query) {
  const paginationError = validatePaginationQuery(query);
  if (paginationError) return paginationError;

  const validActions = new Set(['warn', 'ban', 'mute']);
  if (query.action !== undefined && !validActions.has(query.action)) {
    return 'Query parameter "action" must be one of: warn, ban, mute';
  }

  return null;
}

function validateShiftQuery(query) {
  const paginationError = validatePaginationQuery(query);
  if (paginationError) return paginationError;

  const validTypes = new Set(['start', 'break', 'end']);
  if (query.type !== undefined && !validTypes.has(query.type)) {
    return 'Query parameter "type" must be one of: start, break, end';
  }

  return null;
}

function validateTokenRequestBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Request body must be a JSON object';
  }

  const { label, scopes, ttlMs } = body;

  if (label !== undefined && (typeof label !== 'string' || label.trim().length === 0)) {
    return 'Body parameter "label" must be a non-empty string';
  }

  if (scopes !== undefined && (!Array.isArray(scopes) || scopes.some((scope) => typeof scope !== 'string' || scope.length === 0))) {
    return 'Body parameter "scopes" must be an array of non-empty strings';
  }

  if (ttlMs !== undefined && (!Number.isInteger(ttlMs) || ttlMs <= 0)) {
    return 'Body parameter "ttlMs" must be a positive integer';
  }

  return null;
}

function handleServiceError(res, error) {
  if (error instanceof BackendUnavailableError) {
    return sendError(res, 'BACKEND_UNAVAILABLE', `${error.service} service backend is unavailable`, {
      status: 503,
      details: {
        service: error.service,
        backend: error.backend
      }
    });
  }

  return sendError(res, 'INTERNAL_ERROR', 'Unexpected service failure', {
    status: 500,
    details: { message: error.message }
  });
}

router.get('/moderation/history', async (req, res) => {
  const validationError = validateModerationQuery(req.query);
  if (validationError) {
    return sendError(res, 'INVALID_QUERY', validationError, { status: 400 });
  }

  try {
    const records = await moderationService.getHistory({
      action: req.query.action,
      moderator: req.query.moderator,
      target: req.query.target
    });
    const { data, pagination } = paginate(records, req.query.page, req.query.limit);
    return sendSuccess(res, data, { pagination });
  } catch (error) {
    return handleServiceError(res, error);
  }
});

router.get('/moderation/statistics', async (req, res) => {
  const validationError = validateModerationQuery(req.query);
  if (validationError) {
    return sendError(res, 'INVALID_QUERY', validationError, { status: 400 });
  }

  try {
    const stats = await moderationService.getStatistics({
      action: req.query.action,
      moderator: req.query.moderator,
      target: req.query.target
    });
    return sendSuccess(res, stats);
  } catch (error) {
    return handleServiceError(res, error);
  }
});

router.get('/shifts/history', async (req, res) => {
  const validationError = validateShiftQuery(req.query);
  if (validationError) {
    return sendError(res, 'INVALID_QUERY', validationError, { status: 400 });
  }

  try {
    const records = await shiftService.getEvents({
      type: req.query.type,
      userId: req.query.userId
    });
    const { data, pagination } = paginate(records, req.query.page, req.query.limit);
    return sendSuccess(res, data, { pagination });
  } catch (error) {
    return handleServiceError(res, error);
  }
});

router.get('/shifts/events', async (req, res) => {
  const validationError = validateShiftQuery(req.query);
  if (validationError) {
    return sendError(res, 'INVALID_QUERY', validationError, { status: 400 });
  }

  try {
    const records = await shiftService.getEvents({
      type: req.query.type,
      userId: req.query.userId
    });
    const { data, pagination } = paginate(records, req.query.page, req.query.limit);
    return sendSuccess(res, data, { pagination });
  } catch (error) {
    return handleServiceError(res, error);
  }
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

router.get('/server/configuration', async (_req, res) => {
  try {
    const configuration = await configService.getConfiguration();
    return sendSuccess(res, configuration);
  } catch (error) {
    return handleServiceError(res, error);
  }
});

router.get('/server/mappings', async (_req, res) => {
  try {
    const mappings = await configService.getMappings();
    return sendSuccess(res, mappings);
  } catch (error) {
    return handleServiceError(res, error);
  }
});

router.post('/tokens', (req, res) => {
  const validationError = validateTokenRequestBody(req.body);
  if (validationError) {
    return sendError(res, 'INVALID_BODY', validationError, { status: 400 });
  }

  const { label, scopes, ttlMs } = req.body || {};
  const { record, rawToken } = ApiToken.create({ label, scopes, ttlMs });
  return sendSuccess(res, { token: rawToken, tokenInfo: record }, { status: 201 });
});

router.delete('/tokens/:id', async (req, res, next) => {
  try {
    const revoked = await ApiToken.revoke(req.params.id);
    if (!revoked) {
      return sendError(res, 'NOT_FOUND', 'Token not found or already revoked', { status: 404 });
    }
    return sendSuccess(res, revoked);
  } catch (error) {
    return next(error);
  }
});

router.get('/tokens', async (_req, res, next) => {
  try {
    return sendSuccess(res, await ApiToken.list());
  } catch (error) {
    return next(error);
  }
});

export default router;
