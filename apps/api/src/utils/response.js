import crypto from 'node:crypto';

export function withTrace(req, res, next) {
  const headerTrace = req.header('x-request-id');
  req.traceId = headerTrace ?? crypto.randomUUID();
  res.setHeader('x-request-id', req.traceId);
  next();
}

export function sendSuccess(res, payload, options = {}) {
  const { status = 200, pagination } = options;
  return res.status(status).json({
    success: true,
    data: payload,
    pagination,
    traceId: res.getHeader('x-request-id')
  });
}

export function sendError(res, code, message, options = {}) {
  const { status = 400, details } = options;
  return res.status(status).json({
    success: false,
    error: {
      code,
      message,
      details
    },
    traceId: res.getHeader('x-request-id')
  });
}
