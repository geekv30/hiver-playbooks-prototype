'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { RiCloseLine, RiAddLine, RiArrowUpLine } from 'react-icons/ri';
import Button from '@/components/atoms/Button';
import { SparkleIcon, ExtractIcon } from '@/components/icons/ui';
import type { EditorDoc } from './doc';
import { STARTERS, buildStarterDoc, buildScaffoldDoc } from './coldStart';
import styles from './ColdStartModal.module.css';

interface Props {
  /** Called with the generated AOP + the user's query when they finish a
   *  draft. The query carries into the Copilot thread, which runs the "working"
   *  animation and posts an acknowledgement (the handoff happens there now). */
  onGenerate: (doc: EditorDoc, query: string) => void;
  /** Skip / close (X / Esc / scrim / "start from scratch") - lands on a blank canvas. */
  onDismiss: () => void;
}

const PLACEHOLDER =
  'e.g. When a customer emails about a refund, check the order status, then draft a reply from the knowledge base. Escalate to a manager if the amount is over $200.';

const ACCEPT = '.pdf,.docx,.txt';
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * ColdStartModal - the "draft your AOP with AI" entry shown when a user
 * lands on an empty AOP canvas. Three paths converge on one generate:
 *   1. describe in plain English (the hero input, with the Hiver-AI focus ring),
 *   2. tap a generic starter example (prefills the input),
 *   3. upload an SOP to convert (the input card is also a drop target).
 * On Generate the query hands off to the Copilot panel (which runs the working
 * animation + drafts the AOP); Skip / dismiss lands on a blank canvas.
 *
 * Net-new surface (no Figma answer key); built from the existing atoms + the
 * ChatBar gradient idiom, grounded in 03-research/AI_DRAFT_COLDSTART_PATTERN.md.
 */
export default function ColdStartModal({ onGenerate, onDismiss }: Props) {
  const [text, setText] = useState('');
  const [activeStarter, setActiveStarter] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // Records where a scrim press began, so we only dismiss on a clean scrim
  // click (down + up on the scrim) - never when a drag-select ends there.
  const downTargetRef = useRef<EventTarget | null>(null);

  // Graceful close: run the exit animation, then unmount. Reduced-motion skips
  // straight to dismiss (closing stays false, so the [data-closing] exit never runs).
  const [closing, setClosing] = useState(false);
  const requestClose = useCallback(() => {
    if (closing) return; // a second Esc / scrim click can't queue a second dismiss
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      onDismiss();
      return;
    }
    setClosing(true);
    window.setTimeout(onDismiss, 150); // > --d-crossfade (140ms), the longest exit
  }, [onDismiss, closing]);

  const canGenerate = text.trim().length > 0 || file != null;

  // Focus the input on open.
  useEffect(() => {
    taRef.current?.focus();
  }, []);

  // Dialog-level keys: Esc closes, Cmd/Ctrl+Enter submits, and a minimal focus
  // trap keeps Tab inside.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      requestClose();
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      startGenerate();
      return;
    }
    if (e.key !== 'Tab') return;
    const root = dialogRef.current;
    if (!root) return;
    const focusables = Array.from(
      root.querySelectorAll<HTMLElement>(
        'button, [href], input, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
    if (focusables.length === 0) return;
    const first = focusables[0]!;
    const last = focusables[focusables.length - 1]!;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const setPrompt = useCallback((value: string, starterId: string | null) => {
    setText(value);
    setActiveStarter(starterId);
    const ta = taRef.current;
    if (ta) {
      ta.focus();
      // caret to the end so they can keep typing / editing immediately
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = ta.value.length;
        ta.scrollTop = ta.scrollHeight;
      });
    }
  }, []);

  const onTextChange = (value: string) => {
    setText(value);
    // Once the user edits a prefilled starter, they've taken it over - drop the
    // armed starter so Generate scaffolds from their words instead.
    if (activeStarter) {
      const armed = STARTERS.find((s) => s.id === activeStarter);
      if (!armed || value !== armed.prompt) setActiveStarter(null);
    }
  };

  // Validate type + size before accepting (the picker's `accept` is only a hint
  // and does not apply to drag-drop), so the visible ".pdf, .docx, .txt up to
  // 10 MB" copy is honest, not decorative.
  const acceptFile = (f: File | null) => {
    if (!f) return;
    const ext = `.${(f.name.split('.').pop() ?? '').toLowerCase()}`;
    if (!ACCEPT.split(',').includes(ext)) {
      setUploadError('That file type is not supported. Use a PDF, Word doc, or text file.');
      return;
    }
    if (f.size > MAX_BYTES) {
      setUploadError('That file is over 10 MB. Try a smaller SOP.');
      return;
    }
    setUploadError(null);
    setFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    acceptFile(e.dataTransfer.files?.[0] ?? null);
  };

  // Build the doc + the query string, then hand off to the Copilot thread.
  const startGenerate = () => {
    if (!canGenerate) return;
    // Priority: an uploaded SOP -> scaffold titled from the file; else an armed
    // starter -> its rich doc; else scaffold from the typed description.
    let doc: EditorDoc;
    let query: string;
    if (file) {
      doc = buildScaffoldDoc({ text: text.trim() || undefined, fileName: file.name });
      query = text.trim() || `Turn my SOP "${file.name}" into an AOP.`;
    } else if (activeStarter) {
      const spec = STARTERS.find((s) => s.id === activeStarter)!;
      doc = buildStarterDoc(spec);
      query = spec.prompt;
    } else {
      doc = buildScaffoldDoc({ text: text.trim() });
      query = text.trim();
    }
    onGenerate(doc, query);
  };

  return (
    <div
      className={styles.scrim}
      data-closing={closing || undefined}
      onMouseDown={(e) => {
        downTargetRef.current = e.target;
      }}
      onClick={(e) => {
        if (downTargetRef.current === e.currentTarget && e.target === e.currentTarget)
          requestClose();
      }}
      onKeyDown={onKeyDown}
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cs-title"
      >
        <button type="button" className={styles.close} aria-label="Close" onClick={requestClose}>
          <RiCloseLine />
        </button>

        <header className={styles.head}>
          <div className={styles.titleRow}>
            <SparkleIcon className={styles.titleIco} aria-hidden />
            <h2 id="cs-title" className={styles.title}>
              Draft your AOP with AI
            </h2>
          </div>
        </header>

        <div className={styles.body}>
          <p className={styles.label}>Describe what you want your AOP to do</p>
          {/* Hero input - a static teal "AI" border (Figma 724:37478); the whole
              card is also a drop target for an SOP. */}
          <div
            className={[styles.shell, dragOver ? styles.dragging : ''].filter(Boolean).join(' ')}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false);
            }}
            onDrop={onDrop}
          >
            <div className={styles.field}>
              <textarea
                ref={taRef}
                className={styles.textarea}
                placeholder={PLACEHOLDER}
                value={text}
                spellCheck={false}
                aria-label="Describe your AOP"
                onChange={(e) => onTextChange(e.target.value)}
              />

              <div className={styles.cardBar}>
                <div className={styles.cardBarLeft}>
                  <button
                    type="button"
                    className={styles.addBtn}
                    aria-label="Add"
                    onClick={() => fileRef.current?.click()}
                  >
                    <RiAddLine />
                  </button>
                  {file ? (
                    <span className={styles.fileChip}>
                      <ExtractIcon className={styles.fileIco} aria-hidden />
                      <span className={styles.fileName}>{file.name}</span>
                      <span className={styles.fileSize}>{formatBytes(file.size)}</span>
                      <button
                        type="button"
                        className={styles.fileRemove}
                        aria-label="Remove file"
                        onClick={() => {
                          setFile(null);
                          setUploadError(null);
                          if (fileRef.current) fileRef.current.value = '';
                        }}
                      >
                        <RiCloseLine />
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className={styles.upload}
                      onClick={() => fileRef.current?.click()}
                    >
                      <ExtractIcon className={styles.uploadIco} aria-hidden />
                      Upload existing SOP
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  className={styles.sendBtn}
                  aria-label="Generate AOP"
                  disabled={!canGenerate}
                  onClick={startGenerate}
                >
                  <RiArrowUpLine />
                </button>
              </div>

              <div className={styles.dropHint} aria-hidden={!dragOver}>
                Drop your SOP to convert it to an AOP
              </div>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT}
              className={styles.fileInput}
              onChange={(e) => acceptFile(e.target.files?.[0] ?? null)}
              tabIndex={-1}
              aria-hidden
            />
          </div>

          {uploadError && (
            <p className={styles.uploadError} role="alert">
              {uploadError}
            </p>
          )}

          <p className={styles.eyebrow}>or</p>
          <div className={styles.bubbles}>
            {STARTERS.map((s) => {
              const Icon = s.Icon;
              return (
                <button
                  key={s.id}
                  type="button"
                  className={styles.bubble}
                  data-active={activeStarter === s.id || undefined}
                  onClick={() => setPrompt(s.prompt, s.id)}
                >
                  <Icon className={styles.bubbleIco} aria-hidden />
                  {s.label}
                </button>
              );
            })}
          </div>

          {file && (
            <p className={styles.privacy}>
              Your SOP is read by AI to draft the AOP. Avoid uploading sensitive customer data.
            </p>
          )}
        </div>

        <footer className={styles.footer}>
          <button type="button" className={styles.skip} onClick={requestClose}>
            Start from scratch
          </button>
          <Button
            variant="accent"
            iconLeft={<SparkleIcon />}
            disabled={!canGenerate}
            onClick={startGenerate}
          >
            Generate AOP
          </Button>
        </footer>
      </div>
    </div>
  );
}
