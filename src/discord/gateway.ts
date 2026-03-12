export interface DiscordGatewayClient {
  sendHeartbeat(sequence: number): Promise<void>;
  identify(token: string): Promise<void>;
}

export class MockDiscordGatewayClient implements DiscordGatewayClient {
  public readonly heartbeats: number[] = [];
  public identifiedWith: string | null = null;

  async sendHeartbeat(sequence: number): Promise<void> {
    this.heartbeats.push(sequence);
  }

  async identify(token: string): Promise<void> {
    this.identifiedWith = token;
  }
}

export async function performGatewayHandshake(
  client: DiscordGatewayClient,
  token: string,
  sequence: number,
): Promise<void> {
  await client.identify(token);
  await client.sendHeartbeat(sequence);
}
