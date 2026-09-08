'use client';

import type { ReactNode } from 'react';
import { RiPlayLine } from 'react-icons/ri';
import CopilotSparkle from './CopilotSparkle';
import styles from './PanelTabs.module.css';

export type SideTab = 'copilot' | 'simulate';

const TABS: { id: SideTab; label: string; icon: ReactNode }[] = [
  { id: 'copilot', label: 'Copilot', icon: <CopilotSparkle size={18} tone="flat" /> },
  { id: 'simulate', label: 'Evaluation', icon: <RiPlayLine /> },
];

interface Props {
  active: SideTab;
  onChange: (t: SideTab) => void;
}

/**
 * The side-panel tab header (Figma 688:43499): a two-tab switcher Copilot |
 * Simulate, each a full-width pill target with an icon + label, the active tab
 * inked (Gray 1) over a sliding 3px black underline. Replaces the old floating
 * tool-switcher rail - the tabs live inside the docked panel's header.
 */
export default function PanelTabs({ active, onChange }: Props) {
  const activeIdx = TABS.findIndex((t) => t.id === active);
  return (
    <div className={styles.header}>
      <div className={styles.tabs} role="tablist" aria-label="Side panel">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active === t.id}
            className={styles.tab}
            data-active={active === t.id || undefined}
            onClick={() => onChange(t.id)}
          >
            <span className={styles.icon} aria-hidden>
              {t.icon}
            </span>
            <span className={styles.label}>{t.label}</span>
          </button>
        ))}
        {/* Sliding active-tab underline (3px, Neutrals/Black). Per-tab offset =
            one underline width + the 4px inter-tab gap. */}
        <span
          className={styles.underline}
          style={{ transform: activeIdx === 0 ? 'translateX(0)' : 'translateX(calc(100% + 4px))' }}
          aria-hidden
        />
      </div>
    </div>
  );
}
