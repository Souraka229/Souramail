'use server';

import { revalidatePath } from 'next/cache';
import { requireAppContext } from '@/lib/session';
import { getWebmailClient } from '@/lib/webmail';

export async function markReadAction(formData: FormData): Promise<void> {
  const { workspace } = await requireAppContext();
  const mailboxId = String(formData.get('mailboxId') ?? '');
  const emailId = String(formData.get('emailId') ?? '');
  const seen = String(formData.get('seen') ?? 'true') === 'true';
  try {
    const { jmap } = await getWebmailClient(workspace.workspaceId, mailboxId);
    await jmap.setKeywords(emailId, { $seen: seen });
  } catch {
    /* webmail unavailable — nothing to toggle */
  }
  revalidatePath('/app/inbox');
}
