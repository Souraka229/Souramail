'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createDomain, DomainError, scanDomain } from '@/lib/domains';
import { requireAppContext } from '@/lib/session';

export interface ActionState {
  error?: string;
}

export async function addDomainAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { workspace } = await requireAppContext();
  const name = String(formData.get('name') ?? '');
  let id: string;
  try {
    id = await createDomain(workspace.workspaceId, name);
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
  revalidatePath('/app/domains');
  redirect(`/app/domains/${id}`);
}

export async function scanDomainAction(formData: FormData): Promise<void> {
  const { workspace } = await requireAppContext();
  const id = String(formData.get('id') ?? '');
  await scanDomain(workspace.workspaceId, id);
  revalidatePath(`/app/domains/${id}`);
  revalidatePath('/app/domains');
}
