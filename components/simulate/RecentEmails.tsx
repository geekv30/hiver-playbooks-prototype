'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { RiPlayFill, RiStopCircleLine, RiInboxLine } from 'react-icons/ri';
import { MAILBOXES } from '@/data/mailboxes';
import { recentForMailbox } from '@/data/simFixtures';
import Dropdown from '@/components/atoms/Dropdown';
import EmailCard from './EmailCard';
import EvalBackHeader from './EvalBackHeader';
import type { Verdict } from './RunOutcome';
import { useSimRun } from './useSimRun';
import styles from './RecentEmails.module.css';

interface Props {
  /** Leave this flow back to the Evaluate menu (the top-left back control). */
  onExit: () => void;
}

/**
 * Recent conversations (Figma 695:15007 / 698:21145). Pick a shared mailbox -> its
 * recent inbound conversations list as CHECKBOX rows (multi-select) -> Evaluate the
 * checked ones against the AOP -> each becomes a result card with a streaming trace
 * + a persisted human verdict. Back always lives at the top: from results it
 * returns to the conversation list, from the list it leaves to the Evaluate menu.
 */
export default function RecentEmails({ onExit }: Props) {
  const [mailbox, setMailbox] = useState('');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({});
  const [runIds, setRunIds] = useState<string[] | null>(null);

  const mailboxOptions = useMemo(() => MAILBOXES.map((m) => ({ id: m.id, label: m.name })), []);
  const emails = useMemo(() => recentForMailbox(mailbox), [mailbox]);

  // A new mailbox brings a different inbox - clear any prior selection.
  useEffect(() => {
    setSelected({});
    setRunIds(null);
  }, [mailbox]);

  const running = runIds !== null;
  const runEmails = useMemo(
    () => (runIds ? emails.filter((e) => runIds.includes(e.id)) : []),
    [runIds, emails],
  );
  const { phase, runs, start, stop } = useSimRun(runEmails);

  // Start the run once we've entered run mode (after runEmails has updated).
  useEffect(() => {
    if (runIds && runIds.length) start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runIds]);

  const selectedIds = Object.keys(selected).filter((id) => selected[id]);
  const canEvaluate = selectedIds.length > 0;

  const toggle = (id: string) => setSelected((p) => ({ ...p, [id]: !p[id] }));
  const evaluate = () => setRunIds(selectedIds);
  // Top-back: from results -> back to the conversation list; from the list -> menu.
  const back = () => {
    if (running) {
      stop();
      setRunIds(null);
    } else {
      onExit();
    }
  };

  const showList = !!mailbox || running;
  // The footer is an action bar (Evaluate / Stop), not a way back; it hides once a
  // run has finished (you review the results, then leave from the top).
  const showFooter = showList && emails.length > 0 && (!running || phase !== 'done');

  return (
    <div className={styles.recent}>
      <EvalBackHeader title="Recent conversations" onBack={back} />

      {!running && (
        <div className={styles.pickerRow}>
          <Dropdown
            options={mailboxOptions}
            value={mailbox}
            onChange={setMailbox}
            placeholder="Select SM"
            ariaLabel="Select a shared mailbox"
          />
        </div>
      )}

      {showList &&
        (emails.length === 0 ? (
          <div className={styles.emptyState}>
            <RiInboxLine className={styles.emptyIcon} aria-hidden />
            <p className={styles.emptyText}>No recent conversations in this mailbox.</p>
            <p className={styles.emptyHint}>Pick another mailbox to see conversations you can evaluate.</p>
          </div>
        ) : (
          <div className={styles.list} data-running={running || undefined}>
            {(running ? runEmails : emails).map((e, i) => (
              <div key={e.id} className={styles.cardReveal} style={{ '--i': i } as CSSProperties}>
                <EmailCard
                  email={e}
                  run={running ? runs[e.id] : undefined}
                  selectable={!running}
                  selected={!!selected[e.id]}
                  onToggleSelect={() => toggle(e.id)}
                  verdict={verdicts[e.id]}
                  onVerdict={(v) => setVerdicts((p) => ({ ...p, [e.id]: v }))}
                />
              </div>
            ))}
          </div>
        ))}

      {showFooter && (
        <div className={styles.footer}>
          {running ? (
            <button type="button" className={styles.stopBtn} onClick={back}>
              <RiStopCircleLine />
              <span>Stop test</span>
            </button>
          ) : (
            <button
              type="button"
              className={styles.evalBtn}
              data-ready={canEvaluate || undefined}
              disabled={!canEvaluate}
              onClick={evaluate}
            >
              <RiPlayFill />
              <span>Evaluate</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
