'use server';

import { revalidatePath } from 'next/cache';
import { requireAppContext } from '@/lib/session';
import { getMailbox, WebmailUnavailable } from '@/lib/webmail';

export async function markReadAction(formData: FormData): Promise<void> {
  const { workspace } = await requireAppContext();
  const mailboxId = String(formData.get('mailboxId') ?? '');
  const emailId = String(formData.get('emailId') ?? '');
  const seen = String(formData.get('seen') ?? 'true') === 'true';
  try {
    const mb = await getMailbox(workspace.workspaceId, mailboxId);
    await mb.markRead(emailId, seen);
  } catch {
    /* unavailable — nothing to toggle */
  }
  revalidatePath('/app/inbox');
}

export interface ComposeState {
  ok?: boolean;
  error?: string;
}

export async function sendEmailAction(
  _prev: ComposeState,
  formData: FormData,
): Promise<ComposeState> {
  const { workspace } = await requireAppContext();
  const mailboxId = String(formData.get('mailboxId') ?? '');
  const to = String(formData.get('to') ?? '')
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const subject = String(formData.get('subject') ?? '').trim();
  const text = String(formData.get('text') ?? '');
  const inReplyTo = String(formData.get('inReplyTo') ?? '') || undefined;

  if (to.length === 0) return { error: 'Add at least one recipient.' };
  if (!to.every((a) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a))) {
    return { error: 'One of the recipient addresses looks invalid.' };
  }

  try {
    const mb = await getMailbox(workspace.workspaceId, mailboxId);
    await mb.send({ to, subject, text, inReplyTo });
  } catch (err) {
    if (err instanceof WebmailUnavailable) return { error: err.message };
    return { error: err instanceof Error ? err.message : 'Could not send the message.' };
  }

  revalidatePath('/app/inbox');
  return { ok: true };
}
