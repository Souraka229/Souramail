import { color, font, layout, space } from '@souramail/ui';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui';
import { requireAppContext } from '@/lib/session';
import { AppNav } from './nav';
import { SignOutButton } from './sign-out-button';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { user, workspace } = await requireAppContext();

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: color.background }}>
      <aside
        style={{
          width: layout.sidebarWidth,
          flexShrink: 0,
          borderRight: `1px solid ${color.border}`,
          background: color.surface,
          padding: space.lg,
          display: 'flex',
          flexDirection: 'column',
          gap: space.lg,
        }}
      >
        <div style={{ fontFamily: font.mono, color: color.primary, fontWeight: 600 }}>
          SouraMAIL
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{workspace.name}</span>
          <span>
            <Badge tone={workspace.plan === 'free' ? 'neutral' : 'green'}>
              {workspace.plan.toUpperCase()}
            </Badge>
          </span>
        </div>

        <AppNav />

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: space.sm }}>
          <span style={{ fontSize: 12, color: color.muted, wordBreak: 'break-all' }}>
            {user.email}
          </span>
          <SignOutButton />
        </div>
      </aside>

      <main style={{ flex: 1, padding: space.xl, maxWidth: 960 }}>{children}</main>
    </div>
  );
}
