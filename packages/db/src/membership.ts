/**
 * Reading a user's workspace memberships during request bootstrap.
 *
 * This runs *before* a tenant context is established (we don't yet know which
 * workspace the request is for), so it can't go through the RLS-scoped tables
 * directly. It calls the `app_user_workspaces(text)` SECURITY DEFINER function
 * defined in ./rls.ts, which is the one sanctioned way to cross that boundary —
 * and only ever for the user id passed in.
 */
import { sql } from 'drizzle-orm';
import { type Db, getDb } from './client.ts';

export type MemberRole = 'owner' | 'admin' | 'member';

export interface UserWorkspace {
  workspaceId: string;
  role: MemberRole;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'business';
}

type Row = Record<string, unknown> & {
  workspace_id: string;
  member_role: MemberRole;
  workspace_name: string;
  workspace_slug: string;
  workspace_plan: UserWorkspace['plan'];
};

/** All workspaces the user belongs to, oldest membership first. */
export async function listUserWorkspaces(
  userId: string,
  db: Db = getDb(),
): Promise<UserWorkspace[]> {
  const res = await db.execute<Row>(sql`select * from app_user_workspaces(${userId})`);
  const rows = (res as unknown as { rows: Row[] }).rows ?? (res as unknown as Row[]);
  return rows.map((r) => ({
    workspaceId: r.workspace_id,
    role: r.member_role,
    name: r.workspace_name,
    slug: r.workspace_slug,
    plan: r.workspace_plan,
  }));
}

/** The user's default (first-joined) workspace, or `null` if they have none. */
export async function getDefaultWorkspace(
  userId: string,
  db: Db = getDb(),
): Promise<UserWorkspace | null> {
  const all = await listUserWorkspaces(userId, db);
  return all[0] ?? null;
}
