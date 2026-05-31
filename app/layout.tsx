import type { Metadata } from 'next';
import { inter, jetbrainsMono } from './fonts';
import AgentationMount from '@/components/dev/AgentationMount';
import './globals.css';

export const metadata: Metadata = {
  title: 'Playbooks · Hiver',
  description: 'Workflow editor prototype for Hiver Playbooks',
};

const SHOW_AGENTATION = process.env.NODE_ENV !== 'production';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        {/* App content carries the global UI scale (zoom). */}
        <div className="app-scale">{children}</div>
        {/* Agentation sits OUTSIDE the scale so its overlay measures the real
            viewport and grabs elements correctly. */}
        {SHOW_AGENTATION && <AgentationMount />}
      </body>
    </html>
  );
}
