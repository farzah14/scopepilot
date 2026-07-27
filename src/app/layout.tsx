import type { ReactNode } from 'react';

export const metadata = {
  title: 'ScopePilot',
  description: 'Proposal and scope control for digital agencies.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
