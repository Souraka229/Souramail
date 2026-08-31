'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/icon';

interface Item {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
  soon?: boolean;
}

const SECTIONS: { title: string; items: Item[] }[] = [
  {
    title: 'Workspace',
    items: [
      { href: '/app', label: 'Overview', icon: 'dashboard', exact: true },
      { href: '/app/domains', label: 'Domains', icon: 'dns' },
    ],
  },
  {
    title: 'Mail',
    items: [
      { href: '/app/inbox', label: 'Inbox', icon: 'inbox' },
      { href: '/app/inbox', label: 'Starred', icon: 'star', soon: true },
      { href: '/app/inbox', label: 'Sent', icon: 'send', soon: true },
    ],
  },
  {
    title: 'AI',
    items: [
      { href: '/app', label: 'Copilot', icon: 'auto_awesome', soon: true },
      { href: '/app', label: 'Automations', icon: 'smart_toy', soon: true },
    ],
  },
  {
    title: 'Developer',
    items: [
      { href: '/app/settings/api-keys', label: 'API Keys', icon: 'key' },
      { href: '/app', label: 'Webhooks', icon: 'webhook', soon: true },
      { href: '/app', label: 'MCP', icon: 'account_tree', soon: true },
    ],
  },
];

export function AppNav() {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-4 overflow-y-auto px-sm py-xs">
      {SECTIONS.map((section) => (
        <section key={section.title}>
          <p className="mb-xs px-md font-label-sm text-label-sm uppercase tracking-wider text-outline">
            {section.title}
          </p>
          <div className="space-y-1">
            {section.items.map((item) => {
              const key = `${section.title}/${item.label}`;
              const active =
                !item.soon &&
                (item.exact ? pathname === item.href : pathname.startsWith(item.href));
              const cls = `flex items-center gap-md rounded-full px-md py-xs text-body-sm transition-colors ${
                active
                  ? 'bg-primary-container font-medium text-on-primary-container'
                  : 'text-on-surface-variant hover:bg-surface-container'
              } ${item.soon ? 'cursor-not-allowed opacity-40' : ''}`;
              const content = (
                <>
                  <Icon name={item.icon} className="text-[20px]" />
                  {item.label}
                  {item.soon && (
                    <span className="ml-auto text-[10px] uppercase tracking-wide text-outline">
                      soon
                    </span>
                  )}
                </>
              );
              return item.soon ? (
                <span key={key} className={cls}>
                  {content}
                </span>
              ) : (
                <Link key={key} href={item.href} className={cls}>
                  {content}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </nav>
  );
}
