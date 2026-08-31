import type { ReactNode } from 'react';
import { Icon } from '@/components/icon';
import { Logo } from '@/components/logo';
import { requireAppContext } from '@/lib/session';
import { AppNav } from './nav';
import { SignOutButton } from './sign-out-button';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { user, workspace } = await requireAppContext();
  const initial = (user.name?.trim()?.[0] ?? user.email[0] ?? '?').toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-outline-variant bg-surface-container-lowest">
        <div className="flex items-center gap-xs p-lg">
          <Logo className="h-8 w-8" />
          <span className="font-headline-md text-headline-md tracking-tight text-on-surface">
            SouraMAIL
          </span>
        </div>

        <AppNav />

        <div className="border-t border-outline-variant bg-surface-container-lowest p-md">
          <div className="flex items-center gap-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-label-md text-[13px] font-semibold text-on-primary">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-body-sm font-medium text-on-surface">{user.email}</p>
              <span className="mt-0.5 inline-block rounded-full bg-secondary-container px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-tight text-on-secondary-container">
                {workspace.plan}
              </span>
            </div>
          </div>
          <div className="mt-sm">
            <SignOutButton />
          </div>
        </div>
      </aside>

      {/* Content */}
      <div className="pl-64">
        <header className="fixed left-64 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-outline-variant bg-surface-container-lowest/80 px-lg backdrop-blur-xl">
          <h1 className="w-48 font-headline-md text-[18px] text-on-surface-variant">
            {workspace.name}
          </h1>
          <div className="max-w-2xl flex-1 px-xl">
            <div className="group relative flex h-10 w-full items-center rounded-full border border-transparent bg-surface-container px-md transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <Icon name="search" className="text-[20px] text-outline" />
              <input
                className="w-full border-none bg-transparent px-sm font-body-sm text-on-surface outline-none placeholder:text-outline"
                placeholder="Search emails, people, attachments…"
                type="text"
              />
              <kbd className="hidden h-5 items-center rounded border border-outline-variant bg-surface-container-highest px-1.5 font-mono text-[10px] font-medium text-outline-variant sm:inline-flex">
                ⌘K
              </kbd>
            </div>
          </div>
          <div className="flex items-center gap-md">
            <button
              type="button"
              className="rounded-full p-xs transition-colors hover:bg-surface-container"
            >
              <Icon name="help" className="text-on-surface-variant" />
            </button>
            <button
              type="button"
              className="relative rounded-full p-xs transition-colors hover:bg-surface-container"
            >
              <Icon name="notifications" className="text-on-surface-variant" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-error" />
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-label-md text-[13px] font-semibold text-on-primary">
              {initial}
            </div>
          </div>
        </header>

        <main className="min-h-screen bg-surface pt-16">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
