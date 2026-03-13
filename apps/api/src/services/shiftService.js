import { BackendUnavailableError } from './serviceErrors.js';

const shiftEvents = [
  { id: 's1', type: 'start', userId: 'staff_1', at: '2026-01-12T09:00:00Z' },
  { id: 's2', type: 'break', userId: 'staff_1', at: '2026-01-12T12:00:00Z' },
  { id: 's3', type: 'end', userId: 'staff_1', at: '2026-01-12T17:00:00Z' },
];

function assertBackendAvailable() {
  if (process.env.SHIFT_STORAGE_AVAILABLE === 'false') {
    throw new BackendUnavailableError('shift', 'shift-events-store');
  }
}

export const shiftService = {
  async getEvents(filters = {}) {
    assertBackendAvailable();

    return shiftEvents.filter((item) => {
      if (filters.type && item.type !== filters.type) return false;
      if (filters.userId && item.userId !== filters.userId) return false;
      return true;
    });
  },
};
