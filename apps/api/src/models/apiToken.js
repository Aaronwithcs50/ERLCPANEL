import crypto from 'node:crypto';
import { db } from '@packages/db';

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const DEFAULT_BOOTSTRAP_GUILD_ID = process.env.API_TOKEN_GUILD_ID || 'bootstrap-guild';
const DEFAULT_BOOTSTRAP_GUILD_NAME = process.env.API_TOKEN_GUILD_NAME || 'ERLCPANEL Bootstrap Guild';
const TOKEN_HASH_SALT = 'api-token-hash-v1';
const TOKEN_HASH_ITERATIONS = 100_000;

function toPublicTokenRecord(record) {
  return {
    id: record.id,
    guildId: record.guildId,
    label: record.name,
    scopes: record.scopes,
    tokenHash: record.tokenHash,
    createdAt: record.createdAt.toISOString(),
    expiresAt: record.expiresAt?.toISOString() ?? null,
    revokedAt: record.revokedAt?.toISOString() ?? null,
    lastUsedAt: record.lastUsedAt?.toISOString() ?? null
  };
}

export class ApiToken {
  static hash(token) {
    return crypto
      .pbkdf2Sync(token, TOKEN_HASH_SALT, TOKEN_HASH_ITERATIONS, 64, 'sha512')
      .toString('hex');
  }

  static async #ensureGuild(guildId = DEFAULT_BOOTSTRAP_GUILD_ID) {
    await db.guild.upsert({
      where: { id: guildId },
      create: { id: guildId, name: DEFAULT_BOOTSTRAP_GUILD_NAME },
      update: {}
    });

    return guildId;
  }

  static async create({ guildId = DEFAULT_BOOTSTRAP_GUILD_ID, label = 'default', scopes = ['read'], ttlMs = TOKEN_TTL_MS, rawToken } = {}) {
    const tokenValue = rawToken || crypto.randomBytes(24).toString('hex');
    const tokenHash = this.hash(tokenValue);

    const resolvedGuildId = await this.#ensureGuild(guildId);
    const created = await db.apiToken.create({
      data: {
        guildId: resolvedGuildId,
        name: label,
        scopes,
        tokenHash,
        expiresAt: ttlMs > 0 ? new Date(Date.now() + ttlMs) : null
      }
    });

    return { record: toPublicTokenRecord(created), rawToken: tokenValue };
  }

  static async verify(rawToken) {
    if (!rawToken) return null;

    const tokenHash = this.hash(rawToken);
    const match = await db.apiToken.findUnique({ where: { tokenHash } });

    if (!match || match.revokedAt) return null;
    if (match.expiresAt && match.expiresAt.getTime() < Date.now()) return null;

    const updated = await db.apiToken.update({
      where: { id: match.id },
      data: { lastUsedAt: new Date() }
    });

    return toPublicTokenRecord(updated);
  }

  static async revoke(id) {
    const token = await db.apiToken.findUnique({ where: { id } });
    if (!token || token.revokedAt) return null;

    const updated = await db.apiToken.update({
      where: { id },
      data: { revokedAt: new Date() }
    });

    return toPublicTokenRecord(updated);
  }

  static async list() {
    const tokens = await db.apiToken.findMany({
      orderBy: [{ createdAt: 'desc' }]
    });

    return tokens.map(toPublicTokenRecord);
  }

  static async provisionBootstrapFromEnv() {
    const bootstrapToken = process.env.BOOTSTRAP_API_TOKEN;
    if (!bootstrapToken) return null;

    const tokenHash = this.hash(bootstrapToken);
    const existing = await db.apiToken.findUnique({ where: { tokenHash } });
    if (existing) return { record: toPublicTokenRecord(existing), rawToken: null, created: false };

    const { record } = await this.create({
      guildId: process.env.BOOTSTRAP_API_TOKEN_GUILD_ID || DEFAULT_BOOTSTRAP_GUILD_ID,
      label: process.env.BOOTSTRAP_API_TOKEN_LABEL || 'bootstrap-admin',
      scopes: ['read', 'write', 'admin'],
      ttlMs: Number(process.env.BOOTSTRAP_API_TOKEN_TTL_MS || 0),
      rawToken: bootstrapToken
    });

    return { record, rawToken: bootstrapToken, created: true };
  }
}
