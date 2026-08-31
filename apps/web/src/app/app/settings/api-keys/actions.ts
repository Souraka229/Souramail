'use server';

import { createApiKey, revokeApiKey } from '@souramail/db';
import { revalidatePath } from 'next/cache';
import { requireAppContext } from '@/lib/session';
import { API_SCOPES } from './scopes';

export interface CreateKeyState {
  secret?: string;
  name?: string;
  error?: string;
}

export async function createKeyAction(
  _prev: CreateKeyState,
  formData: FormData,
): Promise<CreateKeyState> {
  const { workspace } = await requireAppContext();
  const name = String(formData.get('name') ?? '').trim();
  if (!name) return { error: 'Give the key a name.' };
  const scopes = API_SCOPES.filter((s) => formData.get(s) === 'on');
  if (scopes.length === 0) return { error: 'Pick at least one scope.' };

  const { secret } = await createApiKey({ tenantId: workspace.workspaceId, name, scopes });
  revalidatePath('/app/settings/api-keys');
  return { secret, name };
}

export async function revokeKeyAction(formData: FormData): Promise<void> {
  const { workspace } = await requireAppContext();
  await revokeApiKey(workspace.workspaceId, String(formData.get('id') ?? ''));
  revalidatePath('/app/settings/api-keys');
}
