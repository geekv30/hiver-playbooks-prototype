import type { Metadata } from 'next';
import { inter, jetbrainsMono } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'Playbooks · Hiver',
  description: 'Workflow editor prototype for Hiver Playbooks',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
