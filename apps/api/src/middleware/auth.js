import { ApiToken } from '../models/apiToken.js';
import { sendError } from '../utils/response.js';

export function authMiddleware(req, res, next) {
  const authHeader = req.header('authorization') || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return sendError(res, 'UNAUTHORIZED', 'Missing bearer token', { status: 401 });
  }

  const validToken = ApiToken.verify(token);
  if (!validToken) {
    return sendError(res, 'UNAUTHORIZED', 'Invalid or expired API token', { status: 401 });
  }

  req.apiToken = validToken;
  return next();
}
