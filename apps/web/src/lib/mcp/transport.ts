import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';

/**
 * Stateless Streamable-HTTP transport for a Next route handler: feed one inbound
 * JSON-RPC message, collect the responses the server emits for it, return them.
 * No sessions, no SSE — the "JSON response" mode of the MCP HTTP transport,
 * which is all a serverless function can do.
 */
export class StatelessTransport implements Transport {
  onmessage?: (message: JSONRPCMessage) => void;
  onclose?: () => void;
  onerror?: (error: Error) => void;

  private readonly out: JSONRPCMessage[] = [];
  private resolve!: () => void;
  private readonly settled = new Promise<void>((r) => {
    this.resolve = r;
  });

  async start(): Promise<void> {}

  async send(message: JSONRPCMessage): Promise<void> {
    this.out.push(message);
    // A single request yields a single response; unblock the handler.
    this.resolve();
  }

  async close(): Promise<void> {
    this.onclose?.();
  }

  /** Drive one request/notification through the connected server. */
  async handle(message: JSONRPCMessage): Promise<JSONRPCMessage[]> {
    const isNotification = !('id' in message) || message.id === undefined || message.id === null;
    this.onmessage?.(message);
    if (isNotification) return [];
    await this.settled;
    return this.out;
  }
}
