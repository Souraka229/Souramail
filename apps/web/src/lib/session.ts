// Server-only module: imported exclusively from `/app/*` server components and
// route handlers. Do not import from a Client Component.
import { getAuth } from '@souramail/auth';
import { getDefaultWorkspace, type UserWorkspace } from '@souramail/db';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
}

/** Current user from the Better Auth session cookie, or `null`. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const res = await getAuth().api.getSession({ headers: await headers() });
  if (!res?.user) return null;
  const u = res.user;
  return {
    id: u.id,
    email: u.email,
    name: u.name ?? null,
    emailVerified: Boolean(u.emailVerified),
  };
}

export interface AppContext {
  user: SessionUser;
  workspace: UserWorkspace;
}

/**
 * Guard for `/app/*` server components: returns the signed-in user and their
 * active (default) workspace, or redirects to sign-in / onboarding.
 */
export async function requireAppContext(): Promise<AppContext> {
  const user = await getSessionUser();
  if (!user) redirect('/sign-in');

  const workspace = await getDefaultWorkspace(user.id);
  if (!workspace) {
    // A signed-in user with no workspace means the sign-up provisioning hook
    // failed. Nothing for them to do here — send them back to a clean sign-in.
    redirect('/sign-in?error=no-workspace');
  }

  return { user, workspace };
}
