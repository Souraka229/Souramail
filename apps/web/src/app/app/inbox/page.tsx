import { listAllMailboxes } from '@souramail/db';
import { emailText, type JmapEmail, type JmapMailbox } from '@souramail/jmap';
import Link from 'next/link';
import { Icon } from '@/components/icon';
import { Callout } from '@/components/ui';
import { requireAppContext } from '@/lib/session';
import { folderLabel, getWebmailClient, WebmailUnavailable } from '@/lib/webmail';
import { markReadAction } from './actions';
import { Compose } from './compose';
import { Live } from './live';

type Search = {
  mailbox?: string;
  folder?: string;
  email?: string;
  compose?: string;
  reply?: string;
};

export default async function InboxPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { workspace } = await requireAppContext();
  const sp = await searchParams;
  const mailboxes = (await listAllMailboxes(workspace.workspaceId)).filter(
    (m) => m.type === 'mailbox',
  );

  if (mailboxes.length === 0) {
    return (
      <Shell>
        <Callout tone="info">
          No mailboxes yet. Create one from a connected domain (Domains → open a domain →
          Mailboxes), then it shows up here.
        </Callout>
        <Link href="/app/domains" className="mt-3 inline-flex items-center gap-2 text-primary">
          <Icon name="dns" className="text-[18px]" /> Go to Domains
        </Link>
      </Shell>
    );
  }

  const activeMailbox = mailboxes.find((m) => m.id === sp.mailbox) ?? mailboxes[0]!;
  const composing = sp.compose != null || sp.reply != null;

  let folders: JmapMailbox[] = [];
  let emails: JmapEmail[] = [];
  let openEmail: JmapEmail | null = null;
  let replyEmail: JmapEmail | null = null;
  let error: string | null = null;
  let activeFolderId = sp.folder ?? '';

  try {
    const { jmap } = await getWebmailClient(workspace.workspaceId, activeMailbox.id);
    folders = await jmap.listMailboxes();
    const inbox = folders.find((f) => f.role === 'inbox') ?? folders[0];
    activeFolderId = folders.find((f) => f.id === sp.folder)?.id ?? inbox?.id ?? '';
    if (activeFolderId && !composing) {
      ({ emails } = await jmap.listEmails({ mailboxId: activeFolderId, limit: 40 }));
    }
    if (sp.email && !composing) openEmail = await jmap.getEmail(sp.email);
    if (sp.reply) replyEmail = await jmap.getEmail(sp.reply);
  } catch (e) {
    error =
      e instanceof WebmailUnavailable
        ? e.message
        : 'Could not reach the mail server. It is stood up in the Phase 1 infrastructure step (infra/DEPLOY.md).';
  }

  const q = (over: Partial<Search>) => {
    const p = new URLSearchParams({
      mailbox: activeMailbox.id,
      ...(activeFolderId ? { folder: activeFolderId } : {}),
      ...(sp.email ? { email: sp.email } : {}),
      ...Object.fromEntries(Object.entries(over).filter(([, v]) => v != null)),
    });
    return `/app/inbox?${p.toString()}`;
  };
  const inboxHref = q({ compose: undefined, reply: undefined });

  return (
    <Shell>
      <Live />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={q({ compose: '1', reply: undefined, email: undefined })}
          className="flex items-center gap-1 rounded-lg bg-[#00A48A] px-3 py-1.5 font-label-sm text-label-sm text-white shadow-sm hover:bg-[#008f78]"
        >
          <Icon name="edit" className="text-[16px]" /> Compose
        </Link>

        {mailboxes.length > 1 && (
          <div className="flex items-center gap-1 rounded-full bg-surface-container p-1">
            {mailboxes.map((m) => (
              <Link
                key={m.id}
                href={`/app/inbox?mailbox=${m.id}`}
                className={`rounded-full px-3 py-1 font-mono text-[12px] ${
                  m.id === activeMailbox.id
                    ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                    : 'text-on-surface-variant'
                }`}
              >
                {m.address}
              </Link>
            ))}
          </div>
        )}
        {folders.map((f) => (
          <Link
            key={f.id}
            href={q({ folder: f.id, email: undefined, compose: undefined, reply: undefined })}
            className={`flex items-center gap-1 rounded-full px-3 py-1 font-label-sm text-label-sm ${
              f.id === activeFolderId && !composing
                ? 'bg-primary-container text-on-primary-container'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {folderLabel(f.role, f.name)}
            {f.unreadEmails > 0 && (
              <span className="rounded-full bg-primary px-1.5 text-[10px] text-on-primary">
                {f.unreadEmails}
              </span>
            )}
          </Link>
        ))}
      </div>

      {error ? (
        <Callout tone="info">
          <strong>{activeMailbox.address}</strong> — {error}
        </Callout>
      ) : composing ? (
        <Compose
          mailboxId={activeMailbox.id}
          fromAddress={activeMailbox.address}
          closeHref={inboxHref}
          prefill={replyEmail ? replyPrefill(replyEmail) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[380px_1fr]">
          {/* List */}
          <div className="flex max-h-[70vh] flex-col divide-y divide-surface-container-high overflow-y-auto rounded-xl border border-surface-container-highest bg-surface-container-lowest">
            {emails.length === 0 && (
              <p className="p-6 text-center text-body-sm text-on-surface-variant">
                This folder is empty.
              </p>
            )}
            {emails.map((m) => {
              const unread = !m.keywords?.$seen;
              return (
                <Link
                  key={m.id}
                  href={q({ email: m.id })}
                  className={`flex flex-col gap-1 px-4 py-3 transition-colors hover:bg-surface-container ${
                    m.id === sp.email ? 'bg-surface-container' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`truncate text-body-sm ${
                        unread ? 'font-semibold text-on-surface' : 'text-on-surface-variant'
                      }`}
                    >
                      {m.from?.[0]?.name || m.from?.[0]?.email || 'Unknown'}
                    </span>
                    <span className="shrink-0 font-label-sm text-[11px] text-outline">
                      {new Date(m.receivedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span
                    className={`truncate text-body-sm ${unread ? 'text-on-surface' : 'text-on-surface-variant'}`}
                  >
                    {m.subject || '(no subject)'}
                  </span>
                  <span className="truncate text-[12px] text-outline">{m.preview}</span>
                </Link>
              );
            })}
          </div>

          {/* Reading pane */}
          <div className="min-h-[300px] rounded-xl border border-surface-container-highest bg-surface-container-lowest p-6">
            {openEmail ? (
              <article className="flex flex-col gap-4">
                <header className="flex flex-col gap-2 border-b border-surface-container-high pb-4">
                  <h2 className="font-headline-md text-[20px] font-semibold">
                    {openEmail.subject || '(no subject)'}
                  </h2>
                  <div className="flex items-center justify-between text-body-sm text-on-surface-variant">
                    <span>
                      {openEmail.from?.[0]?.name
                        ? `${openEmail.from[0].name} <${openEmail.from[0].email}>`
                        : openEmail.from?.[0]?.email}
                    </span>
                    <span>{new Date(openEmail.receivedAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={q({ reply: openEmail.id })}
                      className="flex items-center gap-1 rounded-lg bg-[#00A48A] px-3 py-1 font-label-sm text-label-sm text-white hover:bg-[#008f78]"
                    >
                      <Icon name="reply" className="text-[16px]" /> Reply
                    </Link>
                    <form action={markReadAction}>
                      <input type="hidden" name="mailboxId" value={activeMailbox.id} />
                      <input type="hidden" name="emailId" value={openEmail.id} />
                      <input
                        type="hidden"
                        name="seen"
                        value={openEmail.keywords?.$seen ? 'false' : 'true'}
                      />
                      <button
                        type="submit"
                        className="flex items-center gap-1 rounded-lg border border-surface-container-highest px-3 py-1 font-label-sm text-label-sm text-on-surface-variant hover:bg-surface-container"
                      >
                        <Icon
                          name={openEmail.keywords?.$seen ? 'mark_email_unread' : 'mark_email_read'}
                          className="text-[16px]"
                        />
                        Mark {openEmail.keywords?.$seen ? 'unread' : 'read'}
                      </button>
                    </form>
                  </div>
                </header>
                <pre className="whitespace-pre-wrap break-words font-body-md text-body-sm leading-relaxed text-on-surface">
                  {emailText(openEmail)}
                </pre>
              </article>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-on-surface-variant">
                <Icon name="mail" className="text-[32px] text-outline" />
                <p className="text-body-sm">Select a message to read it.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </Shell>
  );
}

function replyPrefill(e: JmapEmail): {
  to?: string;
  subject?: string;
  inReplyTo?: string;
  quote?: string;
} {
  const subject = e.subject ?? '';
  const body = emailText(e)
    .split('\n')
    .map((l) => `> ${l}`)
    .join('\n');
  return {
    to: e.from?.[0]?.email ?? '',
    subject: /^re:/i.test(subject) ? subject : `Re: ${subject}`,
    inReplyTo: e.messageId?.[0],
    quote: `\n\nOn ${new Date(e.receivedAt).toLocaleString()}, ${
      e.from?.[0]?.email ?? 'someone'
    } wrote:\n${body}`,
  };
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-lg">
      <h1 className="flex items-center gap-sm font-headline-lg text-headline-lg tracking-tight text-on-surface">
        <Icon name="inbox" /> Inbox
      </h1>
      {children}
    </div>
  );
}
