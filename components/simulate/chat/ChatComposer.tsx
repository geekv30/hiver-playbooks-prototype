'use client';

import { useEffect, useRef, useState, type ClipboardEvent, type ComponentProps, type DragEvent } from 'react';
import {
  RiArrowUpLine,
  RiAttachment2,
  RiCloseLine,
  RiFileLine,
  RiFilePdf2Line,
  RiFileTextLine,
  RiFileZipLine,
} from 'react-icons/ri';
import { AiNote } from '@/components/flow01/copilot/CopilotPanel';
import type { ChatAttachment, ChatRun } from './useChatRun';
import styles from './ChatComposer.module.css';

// What the chat widget accepts from a customer.
const MAX_FILES = 5;
const MAX_BYTES = 10 * 1024 * 1024;

let seq = 0;
const fid = () => `file-${(seq += 1)}`;

export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, '')} MB`;
}

function FileGlyph({ type, name }: { type: string; name: string }) {
  if (type === 'application/pdf' || /\.pdf$/i.test(name)) return <RiFilePdf2Line />;
  if (type.startsWith('text/') || /\.(txt|csv|log|json|md)$/i.test(name)) return <RiFileTextLine />;
  if (/zip|compressed|tar/.test(type) || /\.(zip|gz|tar|rar)$/i.test(name)) return <RiFileZipLine />;
  return <RiFileLine />;
}

/** What kind of file, for the tile's second line. */
function kindOf(a: ChatAttachment): string {
  const ext = a.name.includes('.') ? a.name.split('.').pop()!.toUpperCase() : '';
  return [ext, fileSize(a.size)].filter(Boolean).join(' · ');
}

/** Attached files as a sent message shows them: images as thumbnails, other
 *  files as a tile with the name and size. Right-aligned with the bubble. */
export function AttachmentList({ files }: { files: ChatAttachment[] }) {
  return (
    <div className={styles.sent}>
      {files.map((a) =>
        a.url ? (
          <a key={a.id} className={styles.thumb} href={a.url} target="_blank" rel="noreferrer" title={a.name}>
            {/* eslint-disable-next-line @next/next/no-img-element -- a local object URL */}
            <img src={a.url} alt={a.name} />
          </a>
        ) : (
          <span key={a.id} className={styles.tile} title={a.name}>
            <span className={styles.tileIcon} aria-hidden>
              <FileGlyph type={a.type} name={a.name} />
            </span>
            <span className={styles.tileText}>
              <span className={styles.tileName}>{a.name}</span>
              <span className={styles.tileMeta}>{kindOf(a)}</span>
            </span>
          </span>
        ),
      )}
    </div>
  );
}

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
  const [files, setFiles] = useState<ChatAttachment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef(files);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);
  // Files never sent are freed with the composer.
  useEffect(
    () => () => {
      for (const a of filesRef.current) if (a.url) URL.revokeObjectURL(a.url);
    },
    [],
  );

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

  const add = (list: FileList | File[]) => {
    const incoming = Array.from(list);
    if (incoming.length === 0) return;
    const room = MAX_FILES - files.length;
    const tooBig = incoming.filter((f) => f.size > MAX_BYTES);
    const fits = incoming.filter((f) => f.size <= MAX_BYTES).slice(0, Math.max(0, room));
    const next = fits.map<ChatAttachment>((f) => ({
      id: fid(),
      name: f.name || 'pasted-image.png',
      size: f.size,
      type: f.type,
      url: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
    }));
    setFiles([...files, ...next]);
    setError(
      tooBig.length > 0
        ? `${tooBig.length === 1 ? `${tooBig[0]!.name} is` : `${tooBig.length} files are`} over 10 MB, the widget's limit.`
        : incoming.length - tooBig.length > room
          ? `A message can carry ${MAX_FILES} files.`
          : null,
    );
  };

  const remove = (id: string) => {
    const a = files.find((f) => f.id === id);
    if (a?.url) URL.revokeObjectURL(a.url);
    setFiles(files.filter((f) => f.id !== id));
    setError(null);
    inputRef.current?.focus();
  };

  const ready = !run.busy && (value.trim().length > 0 || files.length > 0);
  const submit = () => {
    if (!ready) return;
    void run.send(value, files);
    setValue('');
    setFiles([]); // the message owns them now
    setError(null);
  };

  const onPaste = (e: ClipboardEvent) => {
    if (e.clipboardData.files.length === 0) return;
    e.preventDefault();
    add(e.clipboardData.files);
  };
  const onDrag = (e: DragEvent, over: boolean) => {
    if (!Array.from(e.dataTransfer.types).includes('Files')) return;
    e.preventDefault();
    setDragging(over);
  };

  return (
    <div className={styles.wrap}>
      {files.length > 0 && (
        <ul className={styles.chips} aria-label="Files to send">
          {files.map((a) => (
            <li key={a.id} className={styles.chip}>
              <span className={styles.chipThumb} aria-hidden>
                {a.url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- a local object URL
                  <img src={a.url} alt="" />
                ) : (
                  <FileGlyph type={a.type} name={a.name} />
                )}
              </span>
              <span className={styles.chipText}>
                <span className={styles.chipName}>{a.name}</span>
                <span className={styles.chipMeta}>{fileSize(a.size)}</span>
              </span>
              <button type="button" className={styles.chipRemove} onClick={() => remove(a.id)} aria-label={`Remove ${a.name}`}>
                <RiCloseLine aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p className={styles.error} role="status">
          {error}
        </p>
      )}
      <div
        className={styles.field}
        data-dragging={dragging || undefined}
        onDragOver={(e) => onDrag(e, true)}
        onDragEnter={(e) => onDrag(e, true)}
        onDragLeave={(e) => onDrag(e, false)}
        onDrop={(e) => {
          onDrag(e, false);
          if (e.dataTransfer.files.length) add(e.dataTransfer.files);
        }}
      >
        <button
          type="button"
          className={styles.attach}
          onClick={() => pickerRef.current?.click()}
          aria-label="Attach files"
          title="Attach files"
          disabled={files.length >= MAX_FILES}
        >
          <RiAttachment2 aria-hidden />
        </button>
        <input
          ref={pickerRef}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) add(e.target.files);
            e.target.value = ''; // the same file can be picked again
          }}
        />
        <textarea
          ref={inputRef}
          className={styles.input}
          rows={1}
          value={value}
          placeholder={dragging ? 'Drop to attach' : 'Message as the customer...'}
          aria-label="Message as the customer"
          onChange={(e) => setValue(e.target.value)}
          onPaste={onPaste}
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
