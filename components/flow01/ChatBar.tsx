'use client';

import { useRef, useState } from 'react';
import { RiArrowUpLine } from 'react-icons/ri';
import Button from '@/components/atoms/Button';
import Spinner from '@/components/atoms/Spinner';
import styles from './ChatBar.module.css';

// Chat "ask a question..." bar (flow-01/03 resting, flow-05 gradient focus).
// Visual assistant loop only: send -> "thinking" state -> idle. No real model.
export default function ChatBar() {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [thinking, setThinking] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canSend = value.trim().length > 0 && !thinking;

  const send = () => {
    if (!canSend) return;
    setValue('');
    setThinking(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setThinking(false), 1800);
  };

  return (
    <div className={styles.wrap}>
      {thinking && (
        <div className={styles.thinking}>
          <Spinner size={14} />
          <span>Thinking…</span>
        </div>
      )}
      <div className={`${styles.shell} ${focused ? styles.focused : ''}`}>
        <div className={styles.field}>
          <input
            className={styles.input}
            placeholder="Ask a question…"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                send();
              }
            }}
            spellCheck={false}
          />
          <span className={`${styles.send} ${canSend ? styles.sendActive : ''}`}>
            <Button
              variant="primary"
              size="sm"
              pill
              iconOnly={<RiArrowUpLine />}
              ariaLabel="Send"
              disabled={!canSend}
              onClick={send}
            />
          </span>
        </div>
      </div>
    </div>
  );
}
