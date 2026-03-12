export class ApiError extends Error {
  constructor(message, { status, code, traceId, details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.traceId = traceId;
    this.details = details;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class ErlcPanelClient {
  constructor({ baseUrl, token, maxRetries = 2, retryMethods = ['GET', 'DELETE'] }) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.token = token;
    this.maxRetries = maxRetries;
    this.retryMethods = new Set(retryMethods);
  }

  async request(method, path, { query, body } = {}) {
    const url = new URL(`${this.baseUrl}${path}`);
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) url.searchParams.set(key, value);
      });
    }

    let attempt = 0;
    while (true) {
      const response = await fetch(url, {
        method,
        headers: {
          authorization: `Bearer ${this.token}`,
          'content-type': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined
      });

      const payload = await response.json();
      if (response.ok) return payload;

      const shouldRetry = this.retryMethods.has(method) && [429, 503].includes(response.status) && attempt < this.maxRetries;
      if (shouldRetry) {
        const retryAfter = Number(response.headers.get('retry-after') || 1);
        await sleep(retryAfter * 1000);
        attempt += 1;
        continue;
      }

      throw new ApiError(payload?.error?.message || 'API request failed', {
        status: response.status,
        code: payload?.error?.code,
        traceId: payload?.traceId,
        details: payload?.error?.details
      });
    }
  }

  async *paginate(path, query = {}) {
    let page = 1;
    while (true) {
      const result = await this.request('GET', path, { query: { ...query, page } });
      yield result.data;
      if (!result.pagination || page >= result.pagination.totalPages) break;
      page += 1;
    }
  }

  moderationHistory(query) { return this.request('GET', '/v1/moderation/history', { query }); }
  moderationStatistics() { return this.request('GET', '/v1/moderation/statistics'); }
  shiftHistory(query) { return this.request('GET', '/v1/shifts/history', { query }); }
  shiftEvents(query) { return this.request('GET', '/v1/shifts/events', { query }); }
  activitySummaries() { return this.request('GET', '/v1/activity/summaries'); }
  yearlyReport(year) { return this.request('GET', `/v1/activity/reports/yearly/${year}`); }
  serverConfiguration() { return this.request('GET', '/v1/server/configuration'); }
  serverMappings() { return this.request('GET', '/v1/server/mappings'); }
  listTokens() { return this.request('GET', '/v1/tokens'); }
  createToken(body) { return this.request('POST', '/v1/tokens', { body }); }
  revokeToken(id) { return this.request('DELETE', `/v1/tokens/${id}`); }
}
