import { describe, expect, it } from 'vitest';

import { MockDiscordGatewayClient, performGatewayHandshake } from '../../src/discord/gateway.js';

describe('performGatewayHandshake', () => {
  it('identifies and sends heartbeat in order', async () => {
    const client = new MockDiscordGatewayClient();

    await performGatewayHandshake(client, 'bot-token', 42);

    expect(client.identifiedWith).toBe('bot-token');
    expect(client.heartbeats).toEqual([42]);
  });
});
