'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { RiAddLine, RiSendPlaneFill, RiStopCircleLine, RiMailLine } from 'react-icons/ri';
import type { SimEmail } from '@/data/simFixtures';
import { useSimRun } from './useSimRun';
import RunTrace from './RunTrace';
import StatusPill, { type PillStatus } from './StatusPill';
import styles from './CustomEval.module.css';

/**
 * Custom eval tab (Figma 571:17654 / 18285 / 18731): compose a custom email body
 * -> Send (the composer clears, the email moves into the result card) -> the
 * result streams a trace. Send <-> Stop is driven by the run phase, so a finished
 * run returns to Send (compose a new one), not a stuck Stop. Reuses useSimRun +
 * RunTrace; the trace itself is the scripted fixture (per the current scope).
 */
export default function CustomEval() {
  const [body, setBody] = useState('');
  const [sentBody, setSentBody] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const emails = useMemo<SimEmail[]>(
    () =>
      sentBody !== null
        ? [{ id: 'custom', sender: 'Custom email', subject: 'Custom email', preview: sentBody }]
        : [],
    [sentBody],
  );
  const { phase, runs, start, stop } = useSimRun(emails);
  const run = runs['custom'];
  const running = phase === 'running';
  const hasResult = sentBody !== null && !!run && run.status !== 'idle';

  useEffect(() => {
    if (sentBody !== null) start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentBody]);

  // Auto-grow the composer up to the max-height, then scroll.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [body]);

  const send = () => {
    if (!body.trim() || running) return;
    setSentBody(body);
    setBody('');
  };
  const stopRun = () => {
    stop();
    setSentBody(null);
  };

  return (
    <div className={styles.custom}>
      <div className={styles.body}>
        {hasResult && (
          <article className={styles.result}>
            <div className={styles.resultEmail}>
              <RiMailLine className={styles.mail} aria-hidden />
              <p className={styles.resultText}>{sentBody}</p>
            </div>
            <div className={styles.pillRow}>
              <StatusPill status={run!.status as PillStatus} />
            </div>
            <div className={styles.divider} aria-hidden />
            <RunTrace stepStatus={run!.steps} stepMs={run!.durations} outcome={run!.status} />
          </article>
        )}
      </div>

      <div className={styles.composer}>
        <div className={styles.composerCard}>
          <textarea
            ref={inputRef}
            className={styles.input}
            rows={1}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="compose a custom email body"
            aria-label="Custom email body"
          />
          <div className={styles.row}>
            <button type="button" className={styles.add} aria-label="Add attachment">
              <RiAddLine />
            </button>
            {running ? (
              <button type="button" className={styles.stop} aria-label="Stop test" onClick={stopRun}>
                <RiStopCircleLine />
              </button>
            ) : (
              <button type="button" className={styles.send} onClick={send} disabled={!body.trim()}>
                <RiSendPlaneFill />
                <span>Send</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
