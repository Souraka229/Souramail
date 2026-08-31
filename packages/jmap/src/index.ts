/**
 * Minimal typed JMAP client (RFC 8620 core + RFC 8621 mail), enough for the
 * SouraMAIL webmail: session, Mailbox/get, Email/query + Email/get,
 * Email/set (keywords). Talks to Stalwart, which speaks JMAP natively (docs/05
 * §7, references/README.md #1).
 *
 * No dependencies — global `fetch`.
 */

const MAIL_CAP = 'urn:ietf:params:jmap:mail';
const CORE_CAP = 'urn:ietf:params:jmap:core';

export interface JmapSession {
  apiUrl: string;
  downloadUrl: string;
  uploadUrl: string;
  eventSourceUrl: string;
  primaryAccounts: Record<string, string>;
  accounts: Record<string, { name: string; isPersonal: boolean }>;
}

export interface JmapMailbox {
  id: string;
  name: string;
  role: string | null;
  parentId: string | null;
  totalEmails: number;
  unreadEmails: number;
  sortOrder: number;
}

export interface JmapEmailAddress {
  name?: string | null;
  email: string;
}

export interface JmapEmail {
  id: string;
  threadId: string;
  mailboxIds: Record<string, boolean>;
  keywords: Record<string, boolean>;
  from?: JmapEmailAddress[] | null;
  to?: JmapEmailAddress[] | null;
  subject?: string | null;
  receivedAt: string;
  size: number;
  preview?: string;
  hasAttachment?: boolean;
  bodyValues?: Record<string, { value: string; isTruncated: boolean }>;
  textBody?: { partId: string; type: string }[];
  htmlBody?: { partId: string; type: string }[];
}

export interface JmapCall {
  0: string;
  1: Record<string, unknown>;
  2: string;
}

export class JmapError extends Error {}

export class JmapClient {
  private session?: JmapSession;

  constructor(
    private readonly sessionUrl: string,
    /** Full `Authorization` header value, e.g. `Basic ...` or `Bearer ...`. */
    private readonly authorization: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async getSession(): Promise<JmapSession> {
    if (this.session) return this.session;
    const res = await this.fetchImpl(this.sessionUrl, {
      headers: { authorization: this.authorization, accept: 'application/json' },
    });
    if (!res.ok) throw new JmapError(`JMAP session ${res.status}`);
    this.session = (await res.json()) as JmapSession;
    return this.session;
  }

  /** The mail account id for the authenticated principal. */
  async accountId(): Promise<string> {
    const s = await this.getSession();
    const id = s.primaryAccounts[MAIL_CAP];
    if (!id) throw new JmapError('JMAP: no mail account for this principal');
    return id;
  }

  /** Raw method-call batch. Returns the `methodResponses` array. */
  async request(
    methodCalls: JmapCall[],
    using: string[] = [CORE_CAP, MAIL_CAP],
  ): Promise<JmapCall[]> {
    const s = await this.getSession();
    const res = await this.fetchImpl(s.apiUrl, {
      method: 'POST',
      headers: {
        authorization: this.authorization,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({ using, methodCalls }),
    });
    if (!res.ok) throw new JmapError(`JMAP api ${res.status}: ${await res.text()}`);
    const json = (await res.json()) as { methodResponses: JmapCall[] };
    for (const r of json.methodResponses) {
      if (r[0] === 'error') throw new JmapError(`JMAP error: ${JSON.stringify(r[1])}`);
    }
    return json.methodResponses;
  }

  async listMailboxes(accountId?: string): Promise<JmapMailbox[]> {
    const acc = accountId ?? (await this.accountId());
    const [resp] = await this.request([['Mailbox/get', { accountId: acc, ids: null }, '0']]);
    const list = (resp?.[1] as { list?: JmapMailbox[] } | undefined)?.list ?? [];
    return list.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /** `Email/query` for a mailbox, then `Email/get` on the result via back-reference. */
  async listEmails(opts: {
    mailboxId: string;
    limit?: number;
    position?: number;
    accountId?: string;
  }): Promise<{ emails: JmapEmail[]; total: number }> {
    const acc = opts.accountId ?? (await this.accountId());
    const responses = await this.request([
      [
        'Email/query',
        {
          accountId: acc,
          filter: { inMailbox: opts.mailboxId },
          sort: [{ property: 'receivedAt', isAscending: false }],
          position: opts.position ?? 0,
          limit: opts.limit ?? 40,
          calculateTotal: true,
        },
        '0',
      ],
      [
        'Email/get',
        {
          accountId: acc,
          '#ids': { resultOf: '0', name: 'Email/query', path: '/ids' },
          properties: [
            'id',
            'threadId',
            'mailboxIds',
            'keywords',
            'from',
            'to',
            'subject',
            'receivedAt',
            'size',
            'preview',
            'hasAttachment',
          ],
        },
        '1',
      ],
    ]);
    const query = responses.find((r) => r[2] === '0')?.[1] as { total?: number } | undefined;
    const get = responses.find((r) => r[2] === '1')?.[1] as { list?: JmapEmail[] } | undefined;
    return { emails: get?.list ?? [], total: query?.total ?? 0 };
  }

  async getEmail(id: string, accountId?: string): Promise<JmapEmail | null> {
    const acc = accountId ?? (await this.accountId());
    const [resp] = await this.request([
      [
        'Email/get',
        {
          accountId: acc,
          ids: [id],
          properties: [
            'id',
            'threadId',
            'mailboxIds',
            'keywords',
            'from',
            'to',
            'subject',
            'receivedAt',
            'size',
            'hasAttachment',
            'textBody',
            'htmlBody',
            'bodyValues',
          ],
          fetchTextBodyValues: true,
          fetchHTMLBodyValues: true,
          maxBodyValueBytes: 512000,
        },
        '0',
      ],
    ]);
    const list = (resp?.[1] as { list?: JmapEmail[] } | undefined)?.list ?? [];
    return list[0] ?? null;
  }

  /** Add/remove keywords, e.g. `{ '$seen': true }` to mark read. */
  async setKeywords(id: string, patch: Record<string, boolean>, accountId?: string): Promise<void> {
    const acc = accountId ?? (await this.accountId());
    const update: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(patch)) {
      update[`keywords/${k}`] = v ? true : null;
    }
    await this.request([['Email/set', { accountId: acc, update: { [id]: update } }, '0']]);
  }
}

/** Basic auth header from a mailbox address + secret. */
export function basicAuth(address: string, secret: string): string {
  return `Basic ${Buffer.from(`${address}:${secret}`).toString('base64')}`;
}

/** Pull the best-effort plain-text body out of an `Email/get` result. */
export function emailText(email: JmapEmail): string {
  const part = email.textBody?.[0] ?? email.htmlBody?.[0];
  const raw = part && email.bodyValues?.[part.partId]?.value;
  if (!raw) return email.preview ?? '';
  return part?.type === 'text/html' ? stripHtml(raw) : raw;
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}
