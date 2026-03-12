import { BackendUnavailableError } from './serviceErrors.js';

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

function assertBackendAvailable() {
  if (process.env.CONFIG_STORAGE_AVAILABLE === 'false') {
    throw new BackendUnavailableError('config', 'config-store');
  }
}

export const configService = {
  async getConfiguration() {
    assertBackendAvailable();
    return config;
  },

  async getMappings() {
    const configuration = await this.getConfiguration();
    return {
      roles: configuration.roles,
      channels: configuration.channels
    };
  }
};
