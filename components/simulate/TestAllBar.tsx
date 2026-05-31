'use client';

import { RiPlayFill, RiStopFill, RiRefreshLine } from 'react-icons/ri';
import styles from './TestAllBar.module.css';

export type TestAllMode = 'idle' | 'running' | 'done';

interface Props {
  mode?: TestAllMode;
  onTestAll?: () => void;
  onStop?: () => void;
}

// Pinned footer CTA (Figma 211:24049): full-width accent button. The label/icon
// reflect the run state — Test all emails / Stop Test / Re-test all.
const CONFIG: Record<TestAllMode, { label: string; Icon: typeof RiPlayFill }> = {
  idle: { label: 'Test all emails', Icon: RiPlayFill },
  running: { label: 'Stop test', Icon: RiStopFill },
  done: { label: 'Re-test all', Icon: RiRefreshLine },
};

export default function TestAllBar({ mode = 'idle', onTestAll, onStop }: Props) {
  const { label, Icon } = CONFIG[mode];
  const onClick = mode === 'running' ? onStop : onTestAll;
  return (
    <div className={styles.bar}>
      <button
        type="button"
        className={styles.btn}
        data-mode={mode}
        onClick={onClick}
      >
        <Icon aria-hidden />
        <span>{label}</span>
      </button>
    </div>
  );
}
