'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { RiArrowUpLine, RiAttachment2, RiCloseLine, RiFileTextLine } from 'react-icons/ri';
import {
  STARTERS,
  STARTER_CATEGORIES,
  type StarterCategory,
  type StarterSpec,
} from '@/components/flow01/coldStart';
import SkillMark, { type SkillMarkVariant } from './SkillMark';
import TemplateCard, { type TemplateCardVariant } from './TemplateCard';
import styles from './SkillsEmptyHero.module.css';

const PLACEHOLDER = 'e.g. When a customer asks for a refund, check the order in Shopify and draft a reply';

// Same rules as the draft-with-AI modal, so an SOP is accepted identically on
// both entry points.
const ACCEPT = '.pdf,.docx,.txt';
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

type Filter = 'All' | StarterCategory;

export interface EmptyHeroSubmit {
  prompt: string;
  /** The template card that was clicked; null when the composer sent it. */
  starter: StarterSpec | null;
  /** An attached SOP's file name (the prototype drafts from the name, as the modal does). */
  fileName: string | null;
}

/**
 * The Skills empty state (Figma 3038:24511, refined after Sarvam's agent
 * builder and Dugong's template library): a faded mark, one question, one
 * composer, then the templates under category filters. Picking a template sends
 * it straight to Copilot on the New skill page - the composer is for your own
 * words (or an SOP), not a staging area for a template.
 */
export default function SkillsEmptyHero({
  mark = 'solid',
  card = 'avatars',
  onSubmit,
}: {
  mark?: SkillMarkVariant;
  card?: TemplateCardVariant;
  onSubmit?: (submit: EmptyHeroSubmit) => void;
}) {
  const [text, setText] = useState('');
  const [filter, setFilter] = useState<Filter>('All');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [multiline, setMultiline] = useState(false);

  // Grow with the text (a pasted paragraph runs several lines); the buttons
  // then settle to the bottom row, the way a chat composer does.
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
    setMultiline(el.scrollHeight > 40);
  }, [text, file]);

  // Only offer a filter that has something under it.
  const filters: Filter[] = [
    'All',
    ...STARTER_CATEGORIES.filter((c) => STARTERS.some((s) => s.category === c)),
  ];
  const shown = filter === 'All' ? STARTERS : STARTERS.filter((s) => s.category === filter);
  const canSubmit = text.trim().length > 0 || file != null;

  // The template alone: its own prompt + id, so the editor builds its full doc.
  // Anything typed or attached in the composer is a different skill, not added.
  const pick = (spec: StarterSpec) => {
    onSubmit?.({ prompt: spec.prompt, starter: spec, fileName: null });
  };

  const acceptFile = (f: File | null) => {
    if (!f) return;
    const ext = `.${(f.name.split('.').pop() ?? '').toLowerCase()}`;
    if (!ACCEPT.split(',').includes(ext)) {
      setFileError('That file type is not supported. Use a PDF, Word doc, or text file.');
      return;
    }
    if (f.size > MAX_BYTES) {
      setFileError('That file is over 10 MB. Try a smaller SOP.');
      return;
    }
    setFileError(null);
    setFile(f);
  };

  const clearFile = () => {
    setFile(null);
    setFileError(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const submit = () => {
    if (!canSubmit) return;
    onSubmit?.({ prompt: text.trim(), starter: null, fileName: file?.name ?? null });
  };

  return (
    <section className={styles.hero} aria-labelledby="skills-empty-title">
      <SkillMark variant={mark} />
      <h2 id="skills-empty-title" className={styles.title}>
        What should your skill do?
      </h2>

      <form
        className={`${styles.composer} ai-input-glow`}
        data-multiline={multiline || undefined}
        data-dragging={dragOver || undefined}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          acceptFile(e.dataTransfer.files?.[0] ?? null);
        }}
      >
        <button
          type="button"
          className={styles.iconBtn}
          aria-label="Attach an SOP"
          onClick={() => fileRef.current?.click()}
        >
          <RiAttachment2 aria-hidden />
        </button>
        {file && (
          <span className={styles.fileChip}>
            <RiFileTextLine className={styles.fileIcon} aria-hidden />
            <span className={styles.fileName}>{file.name}</span>
            <button
              type="button"
              className={styles.fileRemove}
              aria-label={`Remove ${file.name}`}
              onClick={clearFile}
            >
              <RiCloseLine aria-hidden />
            </button>
          </span>
        )}
        <textarea
          ref={inputRef}
          className={styles.input}
          rows={1}
          value={text}
          placeholder={file ? 'Add a note, or send to draft from the SOP' : PLACEHOLDER}
          aria-label="Describe what your skill should do"
          spellCheck={false}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            // Not while an IME is composing: that Enter confirms a candidate.
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <button type="submit" className={styles.send} disabled={!canSubmit} aria-label="Draft skill">
          <RiArrowUpLine aria-hidden />
        </button>

        <div className={styles.dropHint} aria-hidden={!dragOver}>
          Drop your SOP to turn it into a skill
        </div>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          className={styles.fileInput}
          tabIndex={-1}
          aria-hidden
          onChange={(e) => acceptFile(e.target.files?.[0] ?? null)}
        />
      </form>
      {fileError && (
        <p className={styles.fileError} role="alert">
          {fileError}
        </p>
      )}

      <div className={styles.templates}>
        <div className={styles.filters} role="group" aria-label="Filter templates">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              className={styles.filter}
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <div className={styles.grid}>
          {shown.map((s) => (
            <TemplateCard key={s.id} spec={s} variant={card} onPick={pick} />
          ))}
        </div>
      </div>
    </section>
  );
}
