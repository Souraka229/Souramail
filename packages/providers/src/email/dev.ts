import type { EmailProvider } from '../interfaces.ts';

/**
 * No-op EmailProvider for local dev / tests. A logger is injected by the caller
 * so this stays runtime-free.
 */
export function createDevEmailProvider(log: (line: string) => void = () => {}): EmailProvider {
  return {
    name: 'dev-noop',
    async send(msg) {
      log(`[dev-email] would send to ${msg.to.join(', ')}: ${msg.subject}`);
      return { providerMessageId: `dev-${Date.now()}` };
    },
  };
}
