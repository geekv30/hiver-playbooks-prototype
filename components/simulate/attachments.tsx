'use client';

import { useEffect, useRef, useState, type ClipboardEvent, type DragEvent, type RefObject } from 'react';
import { RiCloseLine, RiFileLine, RiFilePdf2Line, RiFileTextLine, RiFileZipLine } from 'react-icons/ri';
import styles from './attachments.module.css';

/**
 * Files a test customer attaches, shared by the chat composer and the custom
 * email composer: one limit, one picker / drop / paste flow, one chip, one
 * sent tile. Attachments are UI only; the agent is told the file names.
 */

export const MAX_FILES = 5;
export const MAX_BYTES = 10 * 1024 * 1024;

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  /** An object URL, for an image's thumbnail; null for other files. */
  url: string | null;
}

let seq = 0;
const fid = () => `file-${(seq += 1)}`;

export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, '')} MB`;
}

export function FileGlyph({ type, name }: { type: string; name: string }) {
  if (type === 'application/pdf' || /\.pdf$/i.test(name)) return <RiFilePdf2Line />;
  if (type.startsWith('text/') || /\.(txt|csv|log|json|md)$/i.test(name)) return <RiFileTextLine />;
  if (/zip|compressed|tar/.test(type) || /\.(zip|gz|tar|rar)$/i.test(name)) return <RiFileZipLine />;
  return <RiFileLine />;
}

/** What kind of file, for a tile's second line. */
function kindOf(a: Attachment): string {
  const ext = a.name.includes('.') ? a.name.split('.').pop()!.toUpperCase() : '';
  return [ext, fileSize(a.size)].filter(Boolean).join(' · ');
}

interface Copy {
  /** "<file> is" / "<n> files are", then this. */
  tooBig: string;
  /** Shown when more than MAX_FILES are added. */
  tooMany: string;
}

/**
 * The files waiting to go, with the limits and the error line. Object URLs of
 * files still held are freed on unmount; `take()` hands them to a sent message
 * (which then owns them), `clear()` frees them.
 */
export function useAttachments(copy: Copy) {
  const [files, setFiles] = useState<Attachment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  // Enter / leave fire for every child crossed; count them (Safari gives drag
  // events no relatedTarget, so a contains() check flickers there).
  const depth = useRef(0);
  const filesRef = useRef(files);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);
  useEffect(
    () => () => {
      for (const a of filesRef.current) if (a.url) URL.revokeObjectURL(a.url);
    },
    [],
  );

  const add = (list: FileList | File[]) => {
    const incoming = Array.from(list);
    if (incoming.length === 0) return;
    const room = MAX_FILES - files.length;
    const tooBig = incoming.filter((f) => f.size > MAX_BYTES);
    const fits = incoming.filter((f) => f.size <= MAX_BYTES).slice(0, Math.max(0, room));
    const next = fits.map<Attachment>((f) => ({
      id: fid(),
      name: f.name || 'pasted-image.png',
      size: f.size,
      type: f.type,
      url: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
    }));
    setFiles([...files, ...next]);
    setError(
      tooBig.length > 0
        ? `${tooBig.length === 1 ? `${tooBig[0]!.name} is` : `${tooBig.length} files are`} ${copy.tooBig}`
        : incoming.length - tooBig.length > room
          ? copy.tooMany
          : null,
    );
  };

  const remove = (id: string) => {
    const a = files.find((f) => f.id === id);
    if (a?.url) URL.revokeObjectURL(a.url);
    setFiles(files.filter((f) => f.id !== id));
    setError(null);
  };

  /** Hand the files to a sent message, which owns their URLs from now on. */
  const take = () => {
    const out = files;
    filesRef.current = [];
    setFiles([]);
    setError(null);
    return out;
  };

  const onPaste = (e: ClipboardEvent) => {
    if (e.clipboardData.files.length === 0) return;
    e.preventDefault();
    add(e.clipboardData.files);
  };
  const isFiles = (e: DragEvent) => Array.from(e.dataTransfer.types).includes('Files');
  /** Spread on the drop target. */
  const dropProps = {
    onDragOver: (e: DragEvent) => {
      if (isFiles(e)) e.preventDefault();
    },
    onDragEnter: (e: DragEvent) => {
      if (!isFiles(e)) return;
      e.preventDefault();
      depth.current += 1;
      setDragging(true);
    },
    onDragLeave: (e: DragEvent) => {
      if (!isFiles(e)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setDragging(false);
    },
    onDrop: (e: DragEvent) => {
      if (!isFiles(e)) return;
      e.preventDefault();
      depth.current = 0;
      setDragging(false);
      if (e.dataTransfer.files.length) add(e.dataTransfer.files);
    },
  };

  const clearError = () => setError(null);

  return { files, error, dragging, full: files.length >= MAX_FILES, add, remove, take, clearError, onPaste, dropProps };
}

/** A hidden file picker; open it with `ref.current.click()`. */
export function FilePicker({
  inputRef,
  onFiles,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
  onFiles: (files: FileList) => void;
}) {
  return (
    <input
      ref={inputRef}
      type="file"
      multiple
      hidden
      onChange={(e) => {
        if (e.target.files) onFiles(e.target.files);
        e.target.value = ''; // the same file can be picked again
      }}
    />
  );
}

/** Files waiting to go: thumbnail or glyph, name, size, remove. Without
 *  `onRemove` the chips are read-only (a sent email's files). */
export function AttachmentChips({
  files,
  onRemove,
  label = 'Attached files',
  className,
}: {
  files: Attachment[];
  onRemove?: (id: string) => void;
  label?: string;
  className?: string;
}) {
  if (files.length === 0) return null;
  return (
    <ul className={[styles.chips, className].filter(Boolean).join(' ')} aria-label={label}>
      {files.map((a) => (
        <li key={a.id} className={styles.chip} data-readonly={onRemove ? undefined : true}>
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
          {onRemove ? (
            <button type="button" className={styles.chipRemove} onClick={() => onRemove(a.id)} aria-label={`Remove ${a.name}`}>
              <RiCloseLine aria-hidden />
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/** The over-limit line under the chips. */
export function AttachmentError({ error, className }: { error: string | null; className?: string }) {
  if (!error) return null;
  return (
    <p className={[styles.error, className].filter(Boolean).join(' ')} role="status">
      {error}
    </p>
  );
}

/** Attached files as a sent chat message shows them: images as thumbnails,
 *  other files as a tile with the name and size, right-aligned with the bubble. */
export function AttachmentList({ files }: { files: Attachment[] }) {
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
