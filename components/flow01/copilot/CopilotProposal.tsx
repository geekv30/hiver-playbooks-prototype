'use client';

import { RiAddLine, RiCheckLine, RiArrowGoBackLine } from 'react-icons/ri';
import Button from '@/components/atoms/Button';
import styles from './CopilotProposal.module.css';

export type ProposalState = 'open' | 'applied' | 'dismissed';

interface Props {
  title: string;
  /** One line per change the proposal will make (generic, no case-specific prose). */
  summary: string[];
  state: ProposalState;
  onApply: () => void;
  onDismiss: () => void;
  /** Revert the applied change and re-open the proposal. */
  onUndo: () => void;
}

/**
 * CopilotProposal - the reviewable apply card. The Copilot proposes a concrete,
 * generic change to the playbook; the user reviews the summary and chooses. The
 * document NEVER changes until Apply is pressed (consent-gated). Once resolved it
 * settles to a compact confirmation (Applied + Undo, or Dismissed) - never a dead
 * card. One renderer for every Copilot proposal.
 */
export default function CopilotProposal({ title, summary, state, onApply, onDismiss, onUndo }: Props) {
  if (state === 'applied') {
    return (
      <div className={styles.settled} role="status">
        <span className={styles.checkRing} aria-hidden>
          <RiCheckLine />
        </span>
        <span className={styles.settledText}>Applied to your playbook</span>
        <button type="button" className={styles.undo} onClick={onUndo}>
          <RiArrowGoBackLine aria-hidden />
          Undo
        </button>
      </div>
    );
  }

  if (state === 'dismissed') {
    return (
      <div className={styles.settled} data-muted role="status">
        <span className={styles.settledText} data-muted>
          Suggestion dismissed
        </span>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <span className={styles.eyebrow}>Suggested change</span>
      <p className={styles.title}>{title}</p>
      <ul className={styles.list}>
        {summary.map((line) => (
          <li key={line} className={styles.item}>
            <span className={styles.bullet} aria-hidden>
              <RiAddLine />
            </span>
            <span className={styles.itemText}>{line}</span>
          </li>
        ))}
      </ul>
      <div className={styles.actions}>
        <Button variant="accent" size="sm" onClick={onApply}>
          Apply
        </Button>
        <Button variant="text" size="sm" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </div>
  );
}
