'use server';

import { revalidatePath } from 'next/cache';
import { autoFixDns } from '@/lib/domains';
import { MailboxError, provisionMailbox, type StalwartOutcome } from '@/lib/mailboxes';
import { requireAppContext } from '@/lib/session';

export interface AddMailboxState {
  ok?: {
    address: string;
    password: string;
    stalwart: StalwartOutcome;
    detail?: string;
  };
  error?: string;
}

export async function addMailboxAction(
  _prev: AddMailboxState,
  formData: FormData,
): Promise<AddMailboxState> {
  const { workspace } = await requireAppContext();
  const domainId = String(formData.get('domainId') ?? '');
  const localPart = String(formData.get('localPart') ?? '');

  try {
    const res = await provisionMailbox({
      tenantId: workspace.workspaceId,
      domainId,
      plan: workspace.plan,
      localPart,
    });
    revalidatePath(`/app/domains/${domainId}`);
    return {
      ok: {
        address: res.mailbox.address,
        password: res.password,
        stalwart: res.stalwart,
        detail: res.detail,
      },
    };
  } catch (err) {
    if (err instanceof MailboxError) return { error: err.message };
    throw err;
  }
}

export async function autoFixDnsAction(formData: FormData): Promise<void> {
  const { workspace } = await requireAppContext();
  const domainId = String(formData.get('domainId') ?? '');
  await autoFixDns(workspace.workspaceId, domainId);
  revalidatePath(`/app/domains/${domainId}`);
}
