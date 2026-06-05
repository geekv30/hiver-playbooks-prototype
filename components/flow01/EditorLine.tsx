'use client';

import {
  useRef,
  useLayoutEffect,
  useCallback,
  ReactNode,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
} from 'react';
import type { Fragment } from '@/types/playbook';
import { findAction } from '@/data/library';
import Chip from '@/components/atoms/Chip';
import { txt, PENDING_ACTION } from './doc';
import styles from './EditorLine.module.css';

// A real zero-width space kept in EMPTY text runs so they always own a text line
// box. Without it, the caret in an empty run right after an atomic chip snaps to
// the chip's (taller) box and renders low. The ZWS lives only in the DOM — it is
// stripped from everything the model sees, so there is nothing to backspace and
// no stray character in the data.
const ZWS = '​';
const stripZws = (s: string) => s.replace(/​/g, '');
const leadingZws = (s: string) => s.match(/^​+/)?.[0].length ?? 0;

export interface PaletteRequest {
  /** which world to open: '/' = actions, '@' = references */
  scope: 'actions' | 'references';
  /** index of the text fragment the caret was in */
  fragIndex: number;
  /** caret offset within that text fragment */
  caretOffset: number;
  /** viewport rect of the caret's line, to anchor the popover */
  rect: { left: number; top: number; bottom: number };
}

interface Props {
  fragments: Fragment[];
  placeholder?: ReactNode;
  /** Text edits. coalesceKey lets the parent merge consecutive edits into one undo. */
  onChange: (frags: Fragment[]) => void;
  /** Enter pressed (commit line / make next step). */
  onEnter?: () => void;
  /** Backspace at the very start of an already-empty line. */
  onBackspaceEmpty?: () => void;
  /** '@' typed — open the action palette anchored at the caret. */
  onRequestPalette?: (req: PaletteRequest) => void;
  /** When true, '/' is typed literally (no Actions palette) - e.g. a condition
   *  expression is an NL predicate, not a place to invoke actions. '@' still works. */
  noActions?: boolean;
  /** When set (and token changes), the line focuses itself. */
  autoFocus?: { token: number; atStart: boolean } | null;
  /** Fired when the caret enters this line (focus bubbles from the text spans). */
  onFocus?: () => void;
  ariaLabel?: string;
}

// Structure signature: changes only when tokens are added/removed/reordered,
// never on text content. Used to key text spans so they remount (and re-seed)
// on structural edits but stay put while typing.
function structureSig(frags: Fragment[]): string {
  return frags
    .map((f) =>
      f.kind === 'text'
        ? 't'
        : f.kind === 'chip'
          ? `c:${f.chip.id}`
          : f.kind === 'ref'
            ? `r:${f.refPath}`
            : `k:${f.code}`,
    )
    .join('|');
}

function caretOffsetIn(el: HTMLElement): number {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return 0;
  const r = sel.getRangeAt(0);
  if (!el.contains(r.startContainer)) return 0;
  return r.startOffset;
}

function placeCaret(el: HTMLElement, offset: number) {
  el.focus();
  const node = el.firstChild ?? el;
  const sel = window.getSelection();
  if (!sel) return;
  const range = document.createRange();
  const max = node.nodeType === Node.TEXT_NODE ? (node.textContent?.length ?? 0) : 0;
  const off = Math.min(offset, max);
  try {
    if (node.nodeType === Node.TEXT_NODE) range.setStart(node, off);
    else range.setStart(el, 0);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  } catch {
    /* noop — span may be empty */
  }
}

/**
 * EditorLine — one segmented token line (the trigger, or a step body).
 * Text fragments are uncontrolled contentEditable spans (seeded imperatively so
 * the caret never jumps); chip/ref fragments are atomic <Chip> tokens.
 */
export default function EditorLine({
  fragments,
  placeholder,
  onChange,
  onEnter,
  onBackspaceEmpty,
  onRequestPalette,
  noActions,
  autoFocus,
  onFocus,
  ariaLabel,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const spanRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  const sig = structureSig(fragments);

  const isEmpty =
    fragments.length === 0 ||
    fragments.every((f) => f.kind === 'text' && f.text === '');

  // Read the live DOM back into a Fragment[] (text from spans, tokens from props).
  const readDom = useCallback((): Fragment[] => {
    return fragments.map((f, i) => {
      if (f.kind !== 'text') return f;
      const span = spanRefs.current.get(i);
      // strip the zero-width placeholder so the model never carries it
      return txt(stripZws(span?.textContent ?? f.text));
    });
  }, [fragments]);

  // Reconcile text spans to state without disturbing the caret: only write when
  // the DOM differs (so local typing — already in sync — is left alone; external
  // changes like undo are applied).
  useLayoutEffect(() => {
    fragments.forEach((f, i) => {
      if (f.kind !== 'text') return;
      const span = spanRefs.current.get(i);
      if (!span) return;
      const dom = span.textContent ?? '';
      if (f.text === '') {
        // empty run: hold exactly one ZWS so it keeps a text line box
        if (dom !== ZWS) span.textContent = ZWS;
      } else if (stripZws(dom) !== f.text) {
        // compare stripped so local typing (which leaves a harmless leading ZWS)
        // is not clobbered; only external changes (undo/redo) rewrite the run
        span.textContent = f.text;
      }
    });
  }, [fragments, sig]);

  // Self-focus when the parent requests it (new step, delete, post-insert).
  // Deferred to the next frame and re-queried from the DOM so it survives mount
  // timing and StrictMode's double-invoke.
  const focusToken = autoFocus?.token;
  const atStart = autoFocus?.atStart;
  useLayoutEffect(() => {
    if (focusToken == null) return;
    const raf = requestAnimationFrame(() => {
      const root = rootRef.current;
      if (!root) return;
      const spans = [...root.querySelectorAll<HTMLSpanElement>('[data-frag]')];
      const target = atStart ? spans[0] : spans[spans.length - 1];
      if (target) placeCaret(target, atStart ? 0 : target.textContent?.length ?? 0);
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusToken]);

  const handleInput = useCallback(() => {
    onChange(readDom());
  }, [onChange, readDom]);

  // Clicking the empty padding of the line (not a token) focuses the caret.
  const handleRootMouseDown = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.dataset.frag != null || target.closest(`.${styles.token}`)) return;
    const entries = [...spanRefs.current.entries()].sort((a, b) => a[0] - b[0]);
    const last = entries[entries.length - 1];
    if (last) {
      e.preventDefault();
      placeCaret(last[1], last[1].textContent?.length ?? 0);
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      const targetSpan = e.target as HTMLElement;
      const fragIndex = Number(targetSpan.dataset.frag ?? -1);

      // '@' opens the actions palette ('/' kept as an alias) - but only at a token
      // boundary (line-start or after whitespace), so literal emails, URLs, dates
      // and "and/or" stay literal text. References are reachable inside the palette.
      if (e.key === '@' || e.key === '/') {
        // Condition expressions are NL predicates - take the key literally.
        if (noActions) return;
        // Work in model space: ignore any leading zero-width placeholder.
        const raw = targetSpan.textContent ?? '';
        const offset = Math.max(0, caretOffsetIn(targetSpan) - leadingZws(raw));
        const text = stripZws(raw);
        const atBoundary = offset === 0 || /\s/.test(text.charAt(offset - 1));
        if (!atBoundary) return; // type the character literally
        e.preventDefault();
        const rect = (rootRef.current ?? targetSpan).getBoundingClientRect();
        const caretRect = targetSpan.getBoundingClientRect();
        onRequestPalette?.({
          scope: 'actions',
          fragIndex: Number.isNaN(fragIndex) ? 0 : fragIndex,
          caretOffset: offset,
          rect: { left: caretRect.left, top: rect.top, bottom: rect.bottom },
        });
        return;
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onChange(readDom());
        onEnter?.();
        return;
      }

      if (e.key === 'Backspace') {
        // Model-space offset: a caret just after a leading ZWS counts as 0, so
        // one Backspace deletes the chip / line (no extra press for the ZWS).
        const raw = targetSpan.textContent ?? '';
        const offset = Math.max(0, caretOffsetIn(targetSpan) - leadingZws(raw));
        // Empty line → delete the line.
        if (isEmpty && offset === 0) {
          e.preventDefault();
          onBackspaceEmpty?.();
          return;
        }
        // Caret at the start of a text span that follows a token → delete the token.
        if (offset === 0 && fragIndex > 0) {
          const prev = fragments[fragIndex - 1];
          if (prev && prev.kind !== 'text') {
            e.preventDefault();
            const next = fragments.filter((_, i) => i !== fragIndex - 1);
            onChange(next);
            return;
          }
        }
      }
    },
    [fragments, isEmpty, onChange, onEnter, onBackspaceEmpty, onRequestPalette, noActions, readDom],
  );

  return (
    <div
      ref={rootRef}
      className={styles.line}
      data-empty={isEmpty || undefined}
      onMouseDown={handleRootMouseDown}
      onKeyDown={handleKeyDown}
      onInput={handleInput}
      onFocus={onFocus}
      role="textbox"
      aria-label={ariaLabel}
      aria-multiline="true"
    >
      {fragments.map((f, i) => {
        if (f.kind === 'text') {
          return (
            <span
              key={`${sig}:${i}`}
              data-frag={i}
              className={styles.text}
              contentEditable
              suppressContentEditableWarning
              spellCheck={false}
              ref={(el) => {
                if (el) spanRefs.current.set(i, el);
                else spanRefs.current.delete(i);
              }}
            />
          );
        }
        // chip / ref token — atomic. Delete via Backspace; a polished mouse
        // delete will live in the (future) click-to-configure popover. A token
        // that sits at the visual line edge (only an empty text run beside it)
        // drops its edge margin so the content's left edge lines up with prose-
        // first lines (no 4px skew — Figma puts both at x=0).
        const head = fragments[0];
        const tail = fragments[fragments.length - 1];
        const isLead = i === 1 && head?.kind === 'text' && head.text === '';
        const isTrail =
          i === fragments.length - 2 && tail?.kind === 'text' && tail.text === '';
        const tokenCls = [styles.token, isLead ? styles.tokenLead : '', isTrail ? styles.tokenTrail : '']
          .filter(Boolean)
          .join(' ');
        return (
          <span key={`${sig}:${i}`} className={tokenCls} contentEditable={false}>
            {f.kind === 'chip' ? (
              f.chip.actionId === PENDING_ACTION ? (
                <Chip mode="placeholder" chip={f.chip} />
              ) : (
                <Chip chip={f.chip} metaText={chipMeta(f.chip)} />
              )
            ) : f.kind === 'ref' ? (
              <Chip mode="ref" label={f.refPath} />
            ) : (
              <code className={styles.code}>{f.code}</code>
            )}
          </span>
        );
      })}
      {isEmpty && placeholder && (
        <span className={styles.placeholder} aria-hidden>
          {placeholder}
        </span>
      )}
    </div>
  );
}

function chipMeta(chip: { actionId: string; config: Record<string, unknown> }): string | undefined {
  const m = chip.config?.meta;
  if (typeof m === 'string') return m;
  return findAction(chip.actionId)?.meta;
}
