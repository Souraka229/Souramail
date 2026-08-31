/**
 * Workspace bootstrap — creating the first tenant for a brand-new user.
 *
 * Called from the Better Auth `user.create.after` hook (packages/auth). Runs
 * inside `withTenant()` with a client-generated workspace id: that id is set as
 * `app.tenant_id` for the transaction, so both the `workspace` INSERT (policy
 * `id = app.tenant_id`) and the `membership` INSERT (`tenant_id = app.tenant_id`)
 * satisfy RLS without any escape hatch.
 */
import { randomUUID } from 'node:crypto';
import { type Db, getDb } from './client.ts';
import { membership, workspace } from './schema.ts';
import { withTenant } from './tenant.ts';

export interface CreateWorkspaceInput {
  userId: string;
  /** Human name for the workspace, e.g. derived from the user's name or email. */
  name: string;
}

export interface CreateWorkspaceResult {
  workspaceId: string;
  slug: string;
}

const COMBINING_MARKS = /[̀-ͯ]/g;

/** `"Aicha's team"` -> `"aicha-s-team"`; always non-empty. */
export function slugify(input: string): string {
  const base = input
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 40);
  return base || 'workspace';
}

export async function createWorkspaceWithOwner(
  input: CreateWorkspaceInput,
  db: Db = getDb(),
): Promise<CreateWorkspaceResult> {
  const workspaceId = randomUUID();
  const slug = `${slugify(input.name)}-${workspaceId.slice(0, 6)}`;

  await withTenant(db, workspaceId, async (tx) => {
    await tx.insert(workspace).values({ id: workspaceId, name: input.name, slug });
    await tx
      .insert(membership)
      .values({ tenantId: workspaceId, userId: input.userId, role: 'owner' });
  });

  return { workspaceId, slug };
}
