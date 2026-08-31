import { describe, expect, it, vi } from 'vitest';
import { basicAuth, emailText, JmapClient, type JmapEmail } from '../src/index.ts';

function mockFetch(handler: (url: string, init?: RequestInit) => unknown): typeof fetch {
  return vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const body = handler(String(url), init);
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }) as unknown as typeof fetch;
}

const SESSION = {
  apiUrl: 'https://mail.test/jmap/api',
  downloadUrl: '',
  uploadUrl: '',
  eventSourceUrl: '',
  primaryAccounts: { 'urn:ietf:params:jmap:mail': 'acc1' },
  accounts: { acc1: { name: 'hello@acme.com', isPersonal: true } },
};

describe('JmapClient', () => {
  it('resolves the mail account id from the session', async () => {
    const c = new JmapClient(
      'https://mail.test/jmap',
      'Basic x',
      mockFetch(() => SESSION),
    );
    expect(await c.accountId()).toBe('acc1');
  });

  it('lists emails: Email/query chained into Email/get by back-reference', async () => {
    const calls: unknown[] = [];
    const fetchImpl = mockFetch((url, init) => {
      if (url.endsWith('/jmap')) return SESSION;
      const req = JSON.parse(String(init?.body)) as { methodCalls: unknown[] };
      calls.push(...req.methodCalls);
      return {
        methodResponses: [
          ['Email/query', { ids: ['e1'], total: 1 }, '0'],
          [
            'Email/get',
            { list: [{ id: 'e1', subject: 'Hi', receivedAt: '2026-01-01T00:00:00Z' }] },
            '1',
          ],
        ],
      };
    });
    const c = new JmapClient('https://mail.test/jmap', 'Basic x', fetchImpl);
    const { emails, total } = await c.listEmails({ mailboxId: 'inbox', limit: 10 });
    expect(total).toBe(1);
    expect(emails[0]?.subject).toBe('Hi');
    // the get call must reference the query result, not hard-coded ids
    expect(calls[1]).toMatchObject(['Email/get', { '#ids': { resultOf: '0' } }, '1']);
  });

  it('setKeywords builds an Email/set patch', async () => {
    let sent: Record<string, unknown> | undefined;
    const fetchImpl = mockFetch((url, init) => {
      if (url.endsWith('/jmap')) return SESSION;
      const req = JSON.parse(String(init?.body)) as {
        methodCalls: [string, Record<string, unknown>, string][];
      };
      sent = req.methodCalls[0]?.[1];
      return { methodResponses: [['Email/set', { updated: { e1: null } }, '0']] };
    });
    const c = new JmapClient('https://mail.test/jmap', 'Basic x', fetchImpl);
    await c.setKeywords('e1', { $seen: true });
    expect(sent).toMatchObject({ update: { e1: { 'keywords/$seen': true } } });
  });

  it('throws on a JMAP error response', async () => {
    const fetchImpl = mockFetch((url) =>
      url.endsWith('/jmap')
        ? SESSION
        : { methodResponses: [['error', { type: 'unknownMethod' }, '0']] },
    );
    const c = new JmapClient('https://mail.test/jmap', 'Basic x', fetchImpl);
    await expect(c.listMailboxes()).rejects.toThrow(/JMAP error/);
  });
});

describe('helpers', () => {
  it('basicAuth encodes address:secret', () => {
    expect(basicAuth('a@b.com', 'pw')).toBe(
      `Basic ${Buffer.from('a@b.com:pw').toString('base64')}`,
    );
  });

  it('emailText prefers plain text, falls back to stripped html then preview', () => {
    const withText: JmapEmail = {
      id: '1',
      threadId: 't',
      mailboxIds: {},
      keywords: {},
      receivedAt: '',
      size: 0,
      textBody: [{ partId: 'p1', type: 'text/plain' }],
      bodyValues: { p1: { value: 'hello world', isTruncated: false } },
    };
    expect(emailText(withText)).toBe('hello world');

    const htmlOnly: JmapEmail = {
      ...withText,
      textBody: undefined,
      htmlBody: [{ partId: 'p2', type: 'text/html' }],
      bodyValues: { p2: { value: '<p>hi <b>there</b></p>', isTruncated: false } },
    };
    expect(emailText(htmlOnly)).toBe('hi there');

    const previewOnly: JmapEmail = {
      ...withText,
      textBody: undefined,
      bodyValues: {},
      preview: 'p',
    };
    expect(emailText(previewOnly)).toBe('p');
  });
});
