'use client';

import { useState } from 'react';
import { RiCheckLine, RiAddLine } from 'react-icons/ri';
import { MAILBOXES, mailboxList } from '@/data/mailboxes';
import styles from './CopilotMailboxAsk.module.css';

interface Props {
  /** Set once answered - the control becomes a quiet record of the answer. */
  chosen?: string[];
  onAnswer: (mailboxIds: string[]) => void;
}

// How many mailboxes to offer before the list has to be asked for. The rest are
// one click away, so no skill is ever pushed towards the wrong mailbox just
// because of where it sits in the list. Config, not content (reusability rule).
const INLINE_COUNT = 6;

/**
 * CopilotMailboxAsk - the one question Copilot asks after drafting a skill:
 * which shared mailboxes it will run on. Multi-select chips, then Continue.
 *
 * The answer is stored on the skill (so Enable arrives pre-filled) and starts
 * trigger matching in the background. Deliberately just a question and its
 * answer: the evaluation interface stays in the Evaluation tab.
 */
export default function CopilotMailboxAsk({ chosen, onAnswer }: Props) {
  const [picked, setPicked] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);
  const options = expanded ? MAILBOXES : MAILBOXES.slice(0, INLINE_COUNT);

  if (chosen && chosen.length > 0) {
    return (
      <p className={styles.answered}>
        <RiCheckLine aria-hidden />
        Running on {mailboxList(chosen)}
      </p>
    );
  }

  const toggle = (id: string) =>
    setPicked((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));

  return (
    <div className={styles.ask}>
      <div
        className={styles.chips}
        data-expanded={expanded || undefined}
        role="group"
        aria-label="Shared mailboxes for this skill"
      >
        {options.map((m) => {
          const on = picked.includes(m.id);
          return (
            <button
              key={m.id}
              type="button"
              className={styles.chip}
              data-on={on || undefined}
              aria-pressed={on}
              onClick={() => toggle(m.id)}
            >
              {on && <RiCheckLine className={styles.chipCheck} aria-hidden />}
              {m.name}
            </button>
          );
        })}
        {!expanded && (
          <button
            type="button"
            className={styles.chip}
            data-more
            onClick={() => setExpanded(true)}
          >
            <RiAddLine className={styles.chipCheck} aria-hidden />
            {MAILBOXES.length - INLINE_COUNT} more
          </button>
        )}
      </div>
      <button
        type="button"
        className={styles.confirm}
        disabled={picked.length === 0}
        data-ready={picked.length > 0 || undefined}
        onClick={() => picked.length > 0 && onAnswer(picked)}
      >
        Continue
      </button>
    </div>
  );
}
