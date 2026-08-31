import { color, font } from '@souramail/ui';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'SouraMAIL',
  description: 'Professional email infrastructure. Without the infrastructure headache.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: color.background,
          color: color.foreground,
          fontFamily: font.sans,
        }}
      >
        {children}
      </body>
    </html>
  );
}
