import { BackendUnavailableError } from './serviceErrors.js';

const moderationHistory = [
  { id: 'm1', action: 'warn', moderator: 'mod_1', target: 'user_44', createdAt: '2026-01-10T10:00:00Z' },
  { id: 'm2', action: 'ban', moderator: 'mod_2', target: 'user_18', createdAt: '2026-01-11T14:15:00Z' },
  { id: 'm3', action: 'mute', moderator: 'mod_1', target: 'user_19', createdAt: '2026-01-12T18:30:00Z' }
];

function assertBackendAvailable() {
  if (process.env.MODERATION_STORAGE_AVAILABLE === 'false') {
    throw new BackendUnavailableError('moderation', 'moderation-history-store');
  }
}

export const moderationService = {
  async getHistory(filters = {}) {
    assertBackendAvailable();

    return moderationHistory.filter((item) => {
      if (filters.action && item.action !== filters.action) return false;
      if (filters.moderator && item.moderator !== filters.moderator) return false;
      if (filters.target && item.target !== filters.target) return false;
      return true;
    });
  },

  async getStatistics(filters = {}) {
    const history = await this.getHistory(filters);

    return history.reduce(
      (acc, item) => {
        acc.total += 1;
        acc.byAction[item.action] = (acc.byAction[item.action] || 0) + 1;
        return acc;
      },
      { total: 0, byAction: {} }
    );
  }
};
