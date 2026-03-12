import crypto from 'node:crypto';

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30;

export class ApiToken {
  static #tokens = new Map();

  static create({ label = 'default', scopes = ['read'], ttlMs = TOKEN_TTL_MS, rawToken } = {}) {
    const tokenValue = rawToken || crypto.randomBytes(24).toString('hex');
    const tokenHash = this.hash(tokenValue);
    const now = Date.now();
    const record = {
      id: crypto.randomUUID(),
      label,
      scopes,
      tokenHash,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + ttlMs).toISOString(),
      revokedAt: null,
      lastUsedAt: null
    };
    this.#tokens.set(record.id, record);
    return { record, rawToken: tokenValue };
  }

  static hash(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  static verify(rawToken) {
    if (!rawToken) return null;
    const tokenHash = this.hash(rawToken);
    const match = [...this.#tokens.values()].find((token) => token.tokenHash === tokenHash);
    if (!match || match.revokedAt) return null;
    if (new Date(match.expiresAt).getTime() < Date.now()) return null;
    match.lastUsedAt = new Date().toISOString();
    return match;
  }

  static revoke(id) {
    const token = this.#tokens.get(id);
    if (!token || token.revokedAt) return null;
    token.revokedAt = new Date().toISOString();
    return token;
  }

  static list() {
    return [...this.#tokens.values()];
  }
}

export const bootstrapToken = process.env.BOOTSTRAP_API_TOKEN || 'dev-bootstrap-token';
ApiToken.create({ label: 'bootstrap', scopes: ['read', 'write'], rawToken: bootstrapToken });
