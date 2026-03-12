import { describe, expect, it } from 'vitest';

import { MockDiscordGatewayClient } from '../../src/discord/gateway.js';

describe('MockDiscordGatewayClient', () => {
  it('records heartbeat sequences for deterministic gateway tests', async () => {
    const client = new MockDiscordGatewayClient();

    await client.sendHeartbeat(1);
    await client.sendHeartbeat(2);

    expect(client.heartbeats).toEqual([1, 2]);
  });
});
