import type { ReactNode } from 'react';

export const metadata = {
  title: 'CloudIgniter Template',
  description: 'Starter app for CloudIgniter'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'Arial, sans-serif', margin: 0, padding: 24 }}>
        {children}
      </body>
    </html>
  );
}
