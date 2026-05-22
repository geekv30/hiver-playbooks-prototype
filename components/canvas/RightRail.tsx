'use client';
import type { Playbook, Chip, ConnectorSlug } from '@/types/playbook';
import type { RailTab, RailMode } from '@/hooks/useRail';
import PlaybookTab from './rail/PlaybookTab';
import ConfigTab from './rail/ConfigTab';
import OutputTab from './rail/OutputTab';
import RunTab from './rail/RunTab';
import SetupMode from './rail/SetupMode';
import styles from './RightRail.module.css';

interface Props {
  playbook: Playbook;
  tab: RailTab;
  mode: RailMode;
  configChip: Chip | null;
  setupSlug: ConnectorSlug | null;
  onTabChange: (t: RailTab) => void;
  onSetConnectorAuth: (slug: ConnectorSlug, authed: boolean, label?: string) => void;
  onUpdateChip: (chipId: string, patch: Partial<Chip>) => void;
  onSetBindingActive: (mailboxId: string, active: boolean) => void;
  onOpenSetup: (slug: ConnectorSlug) => void;
  onCloseSetup: () => void;
}

const TABS: Array<{ id: RailTab; label: string }> = [
  { id: 'playbook', label: 'Playbook' },
  { id: 'config',   label: 'Config' },
  { id: 'output',   label: 'Output' },
  { id: 'run',      label: 'Run' },
];

export default function RightRail(props: Props) {
  const { playbook, tab, mode, configChip, setupSlug, onTabChange } = props;

  return (
    <aside className={styles.rail} aria-label="Right rail">
      <div className={styles.tabStrip} role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
            onClick={() => onTabChange(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className={styles.body}>
        <div className={`${styles.modeWrap} ${mode === 'tab' ? styles.visible : ''}`} aria-hidden={mode !== 'tab'}>
          {tab === 'playbook' && (
            <PlaybookTab
              playbook={playbook}
              onSetBindingActive={props.onSetBindingActive}
              onOpenSetup={props.onOpenSetup}
            />
          )}
          {tab === 'config' && (
            <ConfigTab
              chip={configChip}
              onUpdateChip={props.onUpdateChip}
            />
          )}
          {tab === 'output' && (
            <OutputTab chip={configChip} />
          )}
          {tab === 'run' && (
            <RunTab playbook={playbook} />
          )}
        </div>
        <div className={`${styles.modeWrap} ${mode === 'setup' ? styles.visible : ''}`} aria-hidden={mode !== 'setup'}>
          {setupSlug && (
            <SetupMode
              slug={setupSlug}
              authed={playbook.connectors.find((c) => c.slug === setupSlug)?.authed ?? false}
              authedLabel={playbook.connectors.find((c) => c.slug === setupSlug)?.accountLabel}
              onConnect={(label) => props.onSetConnectorAuth(setupSlug, true, label)}
              onClose={props.onCloseSetup}
            />
          )}
        </div>
      </div>
    </aside>
  );
}
