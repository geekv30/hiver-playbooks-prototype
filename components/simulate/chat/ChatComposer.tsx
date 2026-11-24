'use client';

import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { RiArrowUpLine, RiAttachment2 } from 'react-icons/ri';
import { AiNote } from '@/components/flow01/copilot/CopilotPanel';
import { AttachmentChips, AttachmentError, FilePicker, MAX_FILES, useAttachments } from '../attachments';
import type { ChatRun } from './useChatRun';
import styles from './ChatComposer.module.css';

export { AttachmentList, fileSize } from '../attachments';

/**
 * ChatComposer - writing as the customer, as the chat widget lets them: a
 * rounded field that grows to four lines, a paperclip for files (or drop them
 * on the field, or paste an image), and the files waiting to go as chips
 * above it. Files are shown in the chat; the agent is told their names.
 */
export default function ChatComposer({
  run,
  live,
}: {
  run: ChatRun;
  live?: ComponentProps<typeof AiNote>['live'];
}) {
  const [value, setValue] = useState('');
  const att = useAttachments({ tooBig: "over 10 MB, the widget's limit.", tooMany: `A message can carry ${MAX_FILES} files.` });
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!run.busy) inputRef.current?.focus({ preventScroll: true });
  }, [run.busy]);

  // Grow to four lines.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 88)}px`;
  }, [value]);

  const ready = !run.busy && (value.trim().length > 0 || att.files.length > 0);
  const submit = () => {
    if (!ready) return;
    void run.send(value, att.take()); // the message owns the files now
    setValue('');
  };

  return (
    <div className={styles.wrap}>
      <AttachmentChips
        files={att.files}
        label="Files to send"
        onRemove={(id) => {
          att.remove(id);
          inputRef.current?.focus();
        }}
      />
      <AttachmentError error={att.error} />
      <div className={styles.field} data-dragging={att.dragging || undefined} {...att.dropProps}>
        <button
          type="button"
          className={styles.attach}
          onClick={() => pickerRef.current?.click()}
          aria-label="Attach files"
          title="Attach files"
          disabled={att.full}
        >
          <RiAttachment2 aria-hidden />
        </button>
        <FilePicker inputRef={pickerRef} onFiles={att.add} />
        <textarea
          ref={inputRef}
          className={styles.input}
          rows={1}
          value={value}
          placeholder={att.dragging ? 'Drop to attach' : 'Message as the customer...'}
          aria-label="Message as the customer"
          onChange={(e) => setValue(e.target.value)}
          onPaste={att.onPaste}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <button
          type="button"
          className={styles.send}
          aria-label="Send as the customer"
          data-ready={ready || undefined}
          disabled={!ready}
          onClick={submit}
        >
          <RiArrowUpLine />
        </button>
      </div>
      <AiNote live={live} />
    </div>
  );
}
