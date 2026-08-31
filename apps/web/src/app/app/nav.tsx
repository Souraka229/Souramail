'use client';

import { color, radius, space } from '@souramail/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  exact?: boolean;
}

const ITEMS: NavItem[] = [
  { href: '/app', label: 'Overview', exact: true },
  { href: '/app/domains', label: 'Domains' },
  { href: '/app/inbox', label: 'Inbox' },
];

export function AppNav() {
  const pathname = usePathname();
  return (
    <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {ITEMS.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'block',
              padding: `${space.xs}px ${space.sm}px`,
              borderRadius: radius.sm,
              fontSize: 14,
              fontWeight: active ? 600 : 500,
              color: active ? color.primary : color.foreground,
              background: active ? '#00A48A14' : 'transparent',
              textDecoration: 'none',
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
