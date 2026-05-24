'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  RiArrowGoBackLine, RiArrowGoForwardLine, RiPlayLine,
  RiArrowDownSLine, RiMore2Fill, RiCloseLine, RiSearchLine,
  RiArrowLeftSLine, RiArrowRightSLine, RiCheckLine, RiStopCircleLine,
  RiRefreshLine, RiSparklingLine, RiArrowUpSLine, RiArrowDownLine,
  RiDeleteBinLine, RiFileCopyLine, RiAddLine,
} from 'react-icons/ri';
import type { IconType } from 'react-icons';
import styles from './canvas.module.css';
import {
  ACTIONS, BUCKET_TITLES, BUCKET_HINTS, BUCKET_ORDER, REFS,
  ICONS, findAction, type Bucket, type Chip, type AnyStep, type Frag, type ChipStatus,
} from './data';
import { useCanvasState, getChipStatus } from './state';
import { ConfigureBody } from './bodies';
import { parseFragmentsFromDom, getCaretTextOffset, getCaretAnchor } from './dom-parse';

/* ============================================================ */
/* Fragment renderer                                              */
/* ============================================================ */
function FragmentSpan({
  frag, status, onChipClick, selected,
}: {
  frag: Frag;
  status?: ChipStatus;
  onChipClick?: (chipId: string) => void;
  selected?: boolean;
}) {
  if (frag.kind === 'text') {
    // empty text fragments are NOT rendered so the stepBody can match
    // :empty for the placeholder pseudo-element
    if (!frag.text) return null;
    return <>{frag.text}</>;
  }
  if (frag.kind === 'ref') {
    return (
      <span className={styles.refchip} contentEditable={false} data-ref-path={frag.refPath}>{frag.refPath}</span>
    );
  }
  if (frag.kind === 'code') {
    return <code className={styles.codeFrag} contentEditable={false}>{frag.code}</code>;
  }
  // chip
  return (
    <ChipInline
      chip={frag.chip}
      status={status ?? frag.chip.status}
      selected={selected}
      onClick={() => onChipClick?.(frag.chip.id)}
    />
  );
}

function StatusDot({ status }: { status: ChipStatus }) {
  const cls = [
    styles.statusDot,
    status === 'queued'  && styles.statusDotQueued,
    status === 'running' && styles.statusDotRunning,
    status === 'ok'      && styles.statusDotOk,
    status === 'error'   && styles.statusDotError,
    status === 'skipped' && styles.statusDotSkipped,
    status === 'draft'   && styles.statusDotDraft,
  ].filter(Boolean).join(' ');
  return <span className={cls} />;
}

function ChipInline({
  chip, status, selected, onClick,
}: { chip: Chip; status: ChipStatus; selected?: boolean; onClick?: () => void }) {
  const action = findAction(chip.actionId);
  if (!action) return <span>?</span>;
  const Icon: IconType | undefined = ICONS[action.iconKey];
  const cls = [
    styles.chip,
    selected && styles.chipSelected,
    chip.status === 'draft' && styles.chipDraft,
  ].filter(Boolean).join(' ');
  return (
    <span
      className={cls}
      onClick={onClick}
      data-chip-id={chip.id}
      data-bucket={action.bucket}
      data-status={status !== 'idle' && status !== 'draft' ? status : undefined}
      contentEditable={false}
      tabIndex={0}
    >
      <span className={styles.chipIco}>{Icon ? <Icon /> : null}</span>
      {action.brand && (
        <span className={styles.chipBrand}>{action.brand} · </span>
      )}
      <span className={styles.chipVerb}>{action.verb}</span>
      {chip.meta && <span className={styles.chipMeta}>{chip.meta}</span>}
      {status !== 'idle' && status !== 'draft' && (
        <span className={styles.chipStatusDot}><StatusDot status={status} /></span>
      )}
    </span>
  );
}

/* ============================================================ */
/* Step row                                                       */
/* ============================================================ */
function StepActions({
  stepId, canUp, canDown, onUp, onDown, onDuplicate, onDelete,
}: {
  stepId: string;
  canUp: boolean;
  canDown: boolean;
  onUp?: () => void;
  onDown?: () => void;
  onDuplicate?: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onMouse = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (!t) return;
      if (menuRef.current?.contains(t)) return;
      if (btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const id = window.setTimeout(() => document.addEventListener('mousedown', onMouse), 0);
    document.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener('mousedown', onMouse);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const run = (fn?: () => void) => () => { fn?.(); setOpen(false); };

  return (
    <span className={styles.stepActions} data-step-actions-for={stepId} onClick={(e) => e.stopPropagation()}>
      <button
        ref={btnRef}
        className={`${styles.stepKebabBtn} ${open ? styles.stepKebabBtnOpen : ''}`}
        onClick={() => setOpen((o) => !o)}
        title="More"
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
      ><RiMore2Fill /></button>
      {open && (
        <div ref={menuRef} className={styles.stepKebabMenu} role="menu">
          {onUp && (
            <button className={styles.stepKebabItem} onClick={run(onUp)} disabled={!canUp} type="button" role="menuitem">
              <RiArrowUpSLine /> Move up
            </button>
          )}
          {onDown && (
            <button className={styles.stepKebabItem} onClick={run(onDown)} disabled={!canDown} type="button" role="menuitem">
              <RiArrowDownLine /> Move down
            </button>
          )}
          {onDuplicate && (
            <button className={styles.stepKebabItem} onClick={run(onDuplicate)} type="button" role="menuitem">
              <RiFileCopyLine /> Duplicate
            </button>
          )}
          {(onUp || onDown || onDuplicate) && <div className={styles.stepKebabDivider} />}
          <button className={`${styles.stepKebabItem} ${styles.stepKebabItemDanger}`} onClick={run(onDelete)} type="button" role="menuitem">
            <RiDeleteBinLine /> Delete
          </button>
        </div>
      )}
    </span>
  );
}

interface CondActions {
  onAddBranch: () => void;
  onRemoveBranch: (branchId: string) => void;
  onAddStepInBranch: (branchId: string) => void;
  onRemoveSub: (branchId: string, subStepId: string) => void;
  onMoveSubUp: (branchId: string, subStepId: string) => void;
  onMoveSubDown: (branchId: string, subStepId: string) => void;
  onSetSubFragments: (branchId: string, subStepId: string, fragments: Frag[]) => void;
}

function BranchSubRow({
  condStepId, branchId, subStep, subnum, statuses, onChipClick, selectedChipId,
  editable, actions, canUp, canDown, onFragmentsChange, onSlash, onAt,
}: {
  condStepId: string;
  branchId: string;
  subStep: AnyStep;
  subnum: string;
  statuses: Record<string, ChipStatus>;
  onChipClick: (chipId: string) => void;
  selectedChipId: string | null;
  editable: boolean;
  actions?: { onUp: () => void; onDown: () => void; onDelete: () => void };
  canUp?: boolean;
  canDown?: boolean;
  onFragmentsChange?: (fragments: Frag[]) => void;
  onSlash?: (stepId: string, anchor: { top: number; left: number }, textOffset: number) => void;
  onAt?: (stepId: string, anchor: { top: number; left: number }, textOffset: number) => void;
}) {
  const bodyRef = useRef<HTMLSpanElement | null>(null);
  if (subStep.kind !== 'action') return null;
  const isEmpty = !subStep.fragments.some((f) => f.kind === 'chip') &&
                  !subStep.fragments.some((f) => f.kind === 'text' && f.text.trim().length > 0) &&
                  !subStep.fragments.some((f) => f.kind === 'ref' || f.kind === 'code');
  const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (!editable) return;
    if (e.key === '/') {
      e.preventDefault();
      if (bodyRef.current) {
        const anchor = getCaretAnchor(bodyRef.current);
        const offset = getCaretTextOffset(bodyRef.current);
        if (anchor) onSlash?.(subStep.id, anchor, offset);
      }
    } else if (e.key === '@') {
      e.preventDefault();
      if (bodyRef.current) {
        const anchor = getCaretAnchor(bodyRef.current);
        const offset = getCaretTextOffset(bodyRef.current);
        if (anchor) onAt?.(subStep.id, anchor, offset);
      }
    }
  };
  const handleBlur = (e: React.FocusEvent<HTMLSpanElement>) => {
    if (!editable) return;
    if (!bodyRef.current) return;
    const next = e.relatedTarget as HTMLElement | null;
    if (next?.closest?.('[data-slash-picker]')) return;
    const fragments = parseFragmentsFromDom(bodyRef.current, subStep.fragments);
    onFragmentsChange?.(fragments);
  };
  return (
    <div className={`${styles.branchSubrow} ${isEmpty ? styles.branchSubrowEmpty : ''}`} data-step-id={subStep.id}>
      <span className={styles.branchSubnum}>{subnum}</span>
      <span
        ref={bodyRef}
        className={`${styles.branchSubbody} ${editable ? styles.stepBodyEditable : ''}`}
        contentEditable={editable}
        suppressContentEditableWarning
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        data-empty={isEmpty ? 'true' : undefined}
      >
        {subStep.fragments.map((f, fi) => (
          <FragmentSpan
            key={fi}
            frag={f}
            status={f.kind === 'chip' ? statuses[f.chip.id] : undefined}
            onChipClick={onChipClick}
            selected={f.kind === 'chip' && f.chip.id === selectedChipId}
          />
        ))}
      </span>
      {actions && (
        <StepActions
          stepId={subStep.id}
          canUp={!!canUp}
          canDown={!!canDown}
          onUp={actions.onUp}
          onDown={actions.onDown}
          onDelete={actions.onDelete}
        />
      )}
    </div>
  );
}

function StepRow({
  step, num, statuses, onChipClick, selectedChipId, highlight,
  actions, canUp, canDown, editable, onFragmentsChange, onSlash, onAt, condActions,
}: {
  step: AnyStep;
  num: string;
  statuses: Record<string, ChipStatus>;
  onChipClick: (chipId: string) => void;
  selectedChipId: string | null;
  highlight?: boolean;
  actions?: {
    onUp: () => void;
    onDown: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
  };
  canUp?: boolean;
  canDown?: boolean;
  editable?: boolean;
  onFragmentsChange?: (stepId: string, fragments: Frag[]) => void;
  onSlash?: (stepId: string, anchor: { top: number; left: number }, textOffset: number) => void;
  onAt?: (stepId: string, anchor: { top: number; left: number }, textOffset: number) => void;
  condActions?: CondActions;
}) {
  const bodyRef = useRef<HTMLSpanElement | null>(null);
  if (step.kind === 'end') {
    return (
      <div className={`${styles.stepRow} ${styles.stepEnd}`} data-step-id={step.id}>
        <span className={styles.endIcon}><RiStopCircleLine /></span>
        <span className={styles.endLabel}>End playbook</span>
        {step.reason && <span className={styles.endReason}>{step.reason}</span>}
      </div>
    );
  }
  if (step.kind === 'condition') {
    return (
      <div className={`${styles.stepRow} ${highlight ? styles.stepHighlight : ''}`} data-step-id={step.id}>
        <span className={styles.stepDot}><StatusDot status="idle" /></span>
        <span className={styles.stepNum}>{num}</span>
        <span className={styles.stepBody}>
          <span className={styles.condExpr}>If {step.exprText}</span>
          <div className={styles.branches}>
            {step.branches.map((b, bi) => {
              const isDefault = b.label === 'else' || !b.predicate;
              const branchHeader = isDefault ? 'Otherwise' : (bi === 0 ? `If ${b.label}` : `If ${b.label}`);
              return (
                <div key={b.id} className={styles.branch}>
                  <div className={styles.branchHead}>
                    <span className={styles.branchLabel}>{branchHeader}</span>
                    {b.predicate && !isDefault && <code className={styles.branchPredInline}>{b.predicate}</code>}
                  </div>
                  {b.steps.map((bs, si) => {
                    if (bs.kind !== 'action') return null;
                    const subnum = `${num}${String.fromCharCode(96 + si + 1)}`;
                    return (
                      <BranchSubRow
                        key={bs.id}
                        condStepId={step.id}
                        branchId={b.id}
                        subStep={bs}
                        subnum={subnum}
                        statuses={statuses}
                        onChipClick={onChipClick}
                        selectedChipId={selectedChipId}
                        editable={!!editable}
                        canUp={si > 0}
                        canDown={si < b.steps.length - 1}
                        actions={condActions ? {
                          onUp:     () => condActions.onMoveSubUp(b.id, bs.id),
                          onDown:   () => condActions.onMoveSubDown(b.id, bs.id),
                          onDelete: () => condActions.onRemoveSub(b.id, bs.id),
                        } : undefined}
                        onFragmentsChange={(fragments) => condActions?.onSetSubFragments(b.id, bs.id, fragments)}
                        onSlash={(id, anchor, offset) => onSlash?.(id, anchor, offset)}
                        onAt={(id, anchor, offset) => onAt?.(id, anchor, offset)}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </span>
        {actions && (
          <StepActions
            stepId={step.id}
            canUp={!!canUp}
            canDown={!!canDown}
            onUp={actions.onUp}
            onDown={actions.onDown}
            onDuplicate={actions.onDuplicate}
            onDelete={actions.onDelete}
          />
        )}
      </div>
    );
  }
  // action step
  const firstChip = step.fragments.find((f) => f.kind === 'chip');
  const chipStatus = firstChip && firstChip.kind === 'chip' ? (statuses[firstChip.chip.id] ?? firstChip.chip.status) : 'idle';
  const isEmpty = !step.fragments.some((f) => f.kind === 'chip') &&
                   !step.fragments.some((f) => f.kind === 'text' && f.text.trim().length > 0) &&
                   !step.fragments.some((f) => f.kind === 'ref' || f.kind === 'code');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (!editable) return;
    if (e.key === '/') {
      e.preventDefault();
      if (bodyRef.current) {
        const anchor = getCaretAnchor(bodyRef.current);
        const offset = getCaretTextOffset(bodyRef.current);
        if (anchor) onSlash?.(step.id, anchor, offset);
      }
    } else if (e.key === '@') {
      e.preventDefault();
      if (bodyRef.current) {
        const anchor = getCaretAnchor(bodyRef.current);
        const offset = getCaretTextOffset(bodyRef.current);
        if (anchor) onAt?.(step.id, anchor, offset);
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLSpanElement>) => {
    if (!editable) return;
    if (!bodyRef.current) return;
    // skip blur if focus moved to the slash picker
    const next = e.relatedTarget as HTMLElement | null;
    if (next?.closest?.('[data-slash-picker]')) return;
    const fragments = parseFragmentsFromDom(bodyRef.current, step.fragments);
    onFragmentsChange?.(step.id, fragments);
  };

  return (
    <div className={`${styles.stepRow} ${highlight ? styles.stepHighlight : ''} ${isEmpty ? styles.stepEmpty : ''}`} data-step-id={step.id}>
      <span className={styles.stepDot}><StatusDot status={isEmpty ? 'draft' : chipStatus} /></span>
      <span className={styles.stepNum}>{num}</span>
      <span
        ref={bodyRef}
        className={`${styles.stepBody} ${editable ? styles.stepBodyEditable : ''}`}
        contentEditable={editable}
        suppressContentEditableWarning
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        data-empty={isEmpty ? 'true' : undefined}
      >
        {step.fragments.map((f, fi) => (
          <FragmentSpan
            key={fi}
            frag={f}
            status={f.kind === 'chip' ? statuses[f.chip.id] : undefined}
            onChipClick={onChipClick}
            selected={f.kind === 'chip' && f.chip.id === selectedChipId}
          />
        ))}
      </span>
      {actions && (
        <StepActions
          stepId={step.id}
          canUp={!!canUp}
          canDown={!!canDown}
          onUp={actions.onUp}
          onDown={actions.onDown}
          onDuplicate={actions.onDuplicate}
          onDelete={actions.onDelete}
        />
      )}
    </div>
  );
}

/* ============================================================ */
/* Topbar                                                         */
/* ============================================================ */
interface TopbarProps {
  state: ReturnType<typeof useCanvasState>;
  onOpenOverflow: () => void;
  overflowOpen: boolean;
  onOpenActivate: () => void;
  activateOpen: boolean;
}

function Topbar({ state, onOpenOverflow, overflowOpen, onOpenActivate, activateOpen }: TopbarProps) {
  const [savedLabel, setSavedLabel] = useState('Saved');
  useEffect(() => {
    setSavedLabel('Saving');
    const t = window.setTimeout(() => setSavedLabel('Saved'), 800);
    return () => window.clearTimeout(t);
  }, [state.autosaveTick]);

  const inTest = state.mode === 'test-idle' || state.mode === 'test-running' || state.mode === 'test-done';
  const isLive = state.activation.status === 'live';
  const inCleanWipe = state.mode === 'clean-wipe';

  return (
    <header className={styles.topbar}>
      <Link href="/" className={styles.brand}>P</Link>
      <div className={styles.crumb}>
        <Link href="/component/canvas">Playbooks</Link>
        <span className={styles.csep}>/</span>
        <span
          className={styles.crumbName}
          contentEditable={!inTest && !inCleanWipe}
          suppressContentEditableWarning
          data-placeholder="Untitled playbook"
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); (e.currentTarget as HTMLElement).blur(); }
            if (e.key === 'Escape') { (e.currentTarget as HTMLElement).blur(); }
          }}
          onBlur={(e) => {
            const v = e.currentTarget.textContent ?? '';
            if (v !== state.playbook.frontmatter.name) state.setName(v);
          }}
        >
          {state.playbook.frontmatter.name}
        </span>
      </div>

      {inCleanWipe && (
        <span className={styles.cleanWipePill}>
          <RiRefreshLine /> Clean Wipe
          <button className={styles.cleanWipeReset} onClick={state.exitCleanWipe} type="button">Reset</button>
        </span>
      )}

      <span className={styles.savedDot}>
        <span className={`${styles.savedIndicator} ${savedLabel === 'Saving' ? styles.savedIndicatorPulse : ''}`} />
        <span className={styles.savedLabel}>{savedLabel}</span>
      </span>

      <span className={styles.spacer} />

      <button
        className={`${styles.iconBtn} ${!state.canUndo ? styles.iconBtnDisabled : ''}`}
        onClick={state.undo}
        disabled={!state.canUndo}
        title="Undo · Cmd+Z"
        type="button"
      >
        <RiArrowGoBackLine />
      </button>
      <button
        className={`${styles.iconBtn} ${!state.canRedo ? styles.iconBtnDisabled : ''}`}
        onClick={state.redo}
        disabled={!state.canRedo}
        title="Redo · Cmd+Shift+Z"
        type="button"
      >
        <RiArrowGoForwardLine />
      </button>
      <span className={styles.tbDivider} />

      {!inTest ? (
        <button
          className={`${styles.testBtn} ${inCleanWipe ? styles.testBtnDisabled : ''}`}
          onClick={() => state.setMode('test-idle')}
          disabled={inCleanWipe}
          type="button"
        >
          <RiPlayLine /> Test
        </button>
      ) : state.mode === 'test-running' ? (
        <button className={`${styles.testBtn} ${styles.testBtnStop}`} onClick={state.stopTest} type="button">
          <RiStopCircleLine /> Stop
        </button>
      ) : state.mode === 'test-idle' ? (
        <button className={`${styles.testBtn} ${styles.testBtnPrimary}`} onClick={state.exitTest} type="button">
          <RiCloseLine /> Exit test
        </button>
      ) : (
        <>
          <button className={styles.testBtn} onClick={state.replayTest} type="button">
            <RiRefreshLine /> Replay
          </button>
          <button className={`${styles.testBtn} ${styles.testBtnPrimary}`} onClick={state.exitTest} type="button">
            <RiCheckLine /> Done
          </button>
        </>
      )}

      <button
        className={`${styles.activateBtn} ${isLive ? styles.activateLive : ''} ${inCleanWipe || inTest ? styles.activateDisabled : ''}`}
        onClick={onOpenActivate}
        disabled={inCleanWipe || inTest}
        type="button"
      >
        {isLive && <span className={styles.activateLiveDot} />}
        {isLive ? 'Live' : 'Activate'}
        <RiArrowDownSLine />
      </button>

      <button className={`${styles.iconBtn} ${overflowOpen ? styles.iconBtnActive : ''}`} onClick={onOpenOverflow} type="button" title="More">
        <RiMore2Fill />
      </button>
    </header>
  );
}

/* ============================================================ */
/* Left palette                                                   */
/* ============================================================ */
function LeftPalette({
  collapsed, onToggle, onInsert, query, setQuery, onDragActionStart, onDragActionEnd,
}: {
  collapsed: boolean;
  onToggle: () => void;
  onInsert: (id: string) => void;
  query: string;
  setQuery: (q: string) => void;
  onDragActionStart?: (id: string) => void;
  onDragActionEnd?: () => void;
}) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ACTIONS;
    return ACTIONS.filter((a) =>
      a.name.toLowerCase().includes(q) ||
      a.verb.toLowerCase().includes(q) ||
      a.bucket.toLowerCase().includes(q)
    );
  }, [query]);

  const grouped = useMemo(() => {
    return BUCKET_ORDER.reduce<Record<Bucket, typeof ACTIONS>>((acc, b) => {
      acc[b] = filtered.filter((a) => a.bucket === b);
      return acc;
    }, {} as Record<Bucket, typeof ACTIONS>);
  }, [filtered]);

  if (collapsed) {
    return (
      <aside className={`${styles.palette} ${styles.paletteCollapsed}`}>
        <button className={styles.paletteToggle} onClick={onToggle} type="button" title="Expand palette">
          <RiArrowRightSLine />
        </button>
        <div className={styles.paletteBucketIcons}>
          {BUCKET_ORDER.map((b) => {
            const first = ACTIONS.find((a) => a.bucket === b);
            const Icon = first ? ICONS[first.iconKey] : null;
            return (
              <button key={b} className={styles.paletteBucketIcon} onClick={onToggle} title={BUCKET_TITLES[b]} type="button">
                {Icon ? <Icon /> : null}
              </button>
            );
          })}
        </div>
      </aside>
    );
  }

  return (
    <aside className={styles.palette}>
      <div className={styles.paletteHead}>
        <span className={styles.paletteTitle}>Actions</span>
        <button className={styles.paletteToggle} onClick={onToggle} type="button" title="Collapse palette">
          <RiArrowLeftSLine />
        </button>
      </div>
      <div className={styles.paletteSearch}>
        <RiSearchLine />
        <input
          className={styles.paletteSearchInput}
          placeholder="Search actions…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className={styles.paletteList}>
        {BUCKET_ORDER.map((b) => {
          const items = grouped[b];
          if (!items.length) return null;
          return (
            <div key={b} className={styles.paletteBucket}>
              <div className={styles.paletteBucketHead}>
                <span className={styles.paletteBucketName}>{BUCKET_TITLES[b]}</span>
                <span className={styles.paletteBucketHint}>{BUCKET_HINTS[b]}</span>
              </div>
              {items.map((a) => {
                const Icon = ICONS[a.iconKey];
                return (
                  <button
                    key={a.id}
                    className={styles.paletteItem}
                    onClick={() => onInsert(a.id)}
                    data-action-id={a.id}
                    type="button"
                    draggable
                    onDragStart={(e) => {
                      onDragActionStart?.(a.id);
                      e.dataTransfer.effectAllowed = 'copy';
                      try { e.dataTransfer.setData('text/plain', a.id); } catch {}
                    }}
                    onDragEnd={() => onDragActionEnd?.()}
                  >
                    <span className={styles.paletteItemIco}>{Icon ? <Icon /> : null}</span>
                    <span className={styles.paletteItemText}>
                      {a.brand && <span className={styles.paletteItemBrand}>{a.brand} · </span>}
                      <span className={styles.paletteItemName}>{a.verb}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })}
        {!Object.values(grouped).some((v) => v.length) && (
          <div className={styles.paletteEmpty}>No actions match &quot;{query}&quot;.</div>
        )}
      </div>
    </aside>
  );
}

/* ============================================================ */
/* Frontmatter                                                     */
/* ============================================================ */
function FrontmatterCard({
  state,
}: { state: ReturnType<typeof useCanvasState> }) {
  const readOnly = state.mode !== 'edit' && state.mode !== 'clean-wipe';
  const fm = state.playbook.frontmatter;
  const triggerRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className={styles.fm} data-step-id="__frontmatter__">
      <h1
        className={styles.fmTitle}
        contentEditable={!readOnly}
        suppressContentEditableWarning
        data-placeholder="Untitled playbook"
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); (e.currentTarget as HTMLElement).blur(); }
        }}
        onBlur={(e) => {
          const v = e.currentTarget.textContent ?? '';
          if (v !== fm.name) state.setName(v);
        }}
      >
        {fm.name}
      </h1>
      <div
        ref={triggerRef}
        className={styles.fmTrigger}
        contentEditable={!readOnly}
        suppressContentEditableWarning
        data-trigger-row="true"
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); (e.currentTarget as HTMLElement).blur(); }
          else if (e.key === '@' && !readOnly && triggerRef.current) {
            e.preventDefault();
            const anchor = getCaretAnchor(triggerRef.current);
            const offset = getCaretTextOffset(triggerRef.current);
            // adjust offset to skip the "WHEN" label since it's data-skip
            if (anchor) state.openRef({ target: 'trigger', anchor, textOffset: offset, query: '' });
          }
        }}
        onBlur={(e) => {
          if (readOnly) return;
          const next = e.relatedTarget as HTMLElement | null;
          if (next?.closest?.('[data-slash-picker]')) return;
          if (!triggerRef.current) return;
          const fragments = parseFragmentsFromDom(triggerRef.current, fm.triggerFragments);
          state.setTriggerFragments(fragments);
        }}
      >
        <span className={styles.triglabel} contentEditable={false} data-skip="true">WHEN</span>
        {fm.triggerFragments.map((f, i) => (
          <FragmentSpan key={i} frag={f} />
        ))}
      </div>
      <div
        className={styles.fmSummary}
        contentEditable={!readOnly}
        suppressContentEditableWarning
        data-placeholder="Add a short summary…"
        onBlur={(e) => {
          const v = e.currentTarget.textContent ?? '';
          if (v !== fm.summary) state.setSummary(v);
        }}
      >
        {fm.summary}
      </div>
    </div>
  );
}

/* ============================================================ */
/* Configure panel (NO visible "Inspector" word)                  */
/* ============================================================ */
function ConfigurePanel({
  chip, state, panelRef,
}: {
  chip: Chip;
  state: ReturnType<typeof useCanvasState>;
  panelRef: React.RefObject<HTMLElement | null>;
}) {
  const action = findAction(chip.actionId);
  const Icon = action ? ICONS[action.iconKey] : null;
  const status = getChipStatus(state, chip);
  return (
    <aside ref={panelRef} className={styles.configPanel} data-open="true">
      <header className={styles.configHead}>
        <span className={styles.configBucketIco}>{Icon ? <Icon /> : null}</span>
        <div className={styles.configHeadText}>
          <div className={styles.configVerb}>
            {action?.brand && <span className={styles.configBrand}>{action.brand} · </span>}
            {action?.verb}
          </div>
          <div className={styles.configSlug}>{action?.id}</div>
        </div>
        <span className={`${styles.configPill} ${
          status === 'running' ? styles.pillRun :
          status === 'ok'      ? styles.pillOk :
          status === 'error'   ? styles.pillErr :
          status === 'skipped' ? styles.pillSkipped :
                                 styles.pillIdle
        }`}>
          {status === 'running' && <span className={styles.pillDotRun} />}
          {status === 'ok'      && <span className={styles.pillDotOk} />}
          {status === 'error'   && <span className={styles.pillDotErr} />}
          {status === 'idle' || status === 'draft' ? 'Idle' : status[0]!.toUpperCase() + status.slice(1)}
        </span>
        <button className={styles.configClose} onClick={() => state.setConfigChipId(null)} type="button">
          <RiCloseLine />
        </button>
      </header>
      <div className={styles.configBody}>
        <ConfigureBody chip={chip} onMetaChange={(meta) => state.updateChipById(chip.id, { meta })} />
      </div>
      <footer className={styles.configFoot}>
        <button className={styles.configTestBtn} type="button">
          <RiPlayLine /> Test this step
        </button>
        <div className={styles.configStatusStrip}>Never tested.</div>
      </footer>
    </aside>
  );
}

/* ============================================================ */
/* Trace panel (bottom slide-up during test-*)                    */
/* ============================================================ */
function TracePanel({
  state, scrollToStep,
}: {
  state: ReturnType<typeof useCanvasState>;
  scrollToStep: (stepId: string) => void;
}) {
  const [tab, setTab] = useState<'trace' | 'variables' | 'history'>('trace');
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  // close expanded row when trace resets / test exits
  useEffect(() => { if (!state.trace.length) setExpandedIdx(null); }, [state.trace.length]);
  return (
    <section className={styles.tracePanel}>
      <header className={styles.traceHead}>
        <div className={styles.traceTabs}>
          {(['trace', 'variables', 'history'] as const).map((t) => (
            <button
              key={t}
              className={`${styles.traceTab} ${tab === t ? styles.traceTabActive : ''} ${t === 'history' ? styles.traceTabDisabled : ''}`}
              onClick={() => t !== 'history' && setTab(t)}
              type="button"
            >
              {t === 'trace' ? 'Trace' : t === 'variables' ? 'Variables' : 'Run history'}
              {t === 'history' && <span className={styles.traceTabV2Tag}>v2</span>}
            </button>
          ))}
        </div>
        <span className={styles.traceMeta}>
          {state.trace.length} {state.trace.length === 1 ? 'step' : 'steps'}
          {state.testOutcome === 'pass' && <span className={styles.traceOutcomeOk}> · passed</span>}
          {state.testOutcome === 'fail' && <span className={styles.traceOutcomeErr}> · failed</span>}
          {state.testOutcome === 'cancelled' && <span className={styles.traceOutcomeCancelled}> · cancelled</span>}
        </span>
      </header>
      <div className={styles.traceList}>
        {tab === 'trace' && (
          <>
            {!state.trace.length && (
              <div className={styles.traceEmpty}>No steps run yet. Click <strong>Run test</strong> above to start.</div>
            )}
            {state.trace.map((entry, i) => {
              const chip = entry.chipId ? findChipInState(state.playbook.steps, entry.chipId) : null;
              const action = chip ? findAction(chip.actionId) : null;
              const Icon = action ? ICONS[action.iconKey] : null;
              const isExpanded = expandedIdx === i;
              const formatPretty = (v?: string) => {
                if (!v) return '';
                try { return JSON.stringify(JSON.parse(v), null, 2); } catch { return v; }
              };
              return (
                <div key={i} className={`${styles.traceRowWrap} ${isExpanded ? styles.traceRowWrapOpen : ''}`}>
                  <button
                    className={styles.traceRow}
                    data-status={entry.status}
                    onClick={() => {
                      setExpandedIdx(isExpanded ? null : i);
                      scrollToStep(entry.stepId);
                    }}
                    type="button"
                  >
                    <span className={styles.traceRowChevron} data-open={isExpanded ? 'true' : 'false'}>{isExpanded ? '▾' : '▸'}</span>
                    <span className={styles.traceRowNum}>{String(i + 1).padStart(2, '0')}</span>
                    <span className={styles.traceRowIco}>{Icon ? <Icon /> : null}</span>
                    <span className={styles.traceRowVerb}>
                      {action?.brand && <span className={styles.traceRowBrand}>{action.brand} · </span>}
                      {action?.verb ?? '—'}
                    </span>
                    <span className={styles.traceRowDur}>{entry.durationMs ? `${entry.durationMs}ms` : '—'}</span>
                    <span className={`${styles.traceRowStatus} ${
                      entry.status === 'ok'      ? styles.traceStatusOk :
                      entry.status === 'error'   ? styles.traceStatusErr :
                      entry.status === 'skipped' ? styles.traceStatusSkipped :
                                                   styles.traceStatusRun
                    }`}>{entry.status}</span>
                    <span className={styles.traceRowOutput}>{entry.output}</span>
                  </button>
                  {isExpanded && (
                    <div className={styles.traceRowDetail}>
                      <div className={styles.traceDetailBlock}>
                        <div className={styles.traceDetailLabel}>Input</div>
                        <pre className={styles.traceDetailPre}>{formatPretty(entry.input) || '—'}</pre>
                      </div>
                      <div className={styles.traceDetailBlock}>
                        <div className={styles.traceDetailLabel}>Output</div>
                        <pre className={styles.traceDetailPre}>{formatPretty(entry.output) || '—'}</pre>
                      </div>
                      {entry.errorMessage && (
                        <div className={styles.traceDetailBlock}>
                          <div className={styles.traceDetailLabel} data-tone="err">Error</div>
                          <pre className={styles.traceDetailPre} data-tone="err">{entry.errorMessage}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
        {tab === 'variables' && (
          <div className={styles.traceVars}>
            <div className={styles.traceVarsRow}><code className={styles.traceVarsKey}>from.email</code><span className={styles.traceVarsVal}>rhys@walkjapan.com</span></div>
            <div className={styles.traceVarsRow}><code className={styles.traceVarsKey}>from.name</code><span className={styles.traceVarsVal}>Rhys Coleman</span></div>
            <div className={styles.traceVarsRow}><code className={styles.traceVarsKey}>ai_extract.output.tour</code><span className={styles.traceVarsVal}>Nakasendo</span></div>
            <div className={styles.traceVarsRow}><code className={styles.traceVarsKey}>ai_extract.output.dates</code><span className={styles.traceVarsVal}>Apr 4–8</span></div>
            <div className={styles.traceVarsRow}><code className={styles.traceVarsKey}>ai_extract.output.group</code><span className={styles.traceVarsVal}>2</span></div>
            <div className={styles.traceVarsRow}><code className={styles.traceVarsKey}>availability</code><span className={styles.traceVarsVal}>yes</span></div>
          </div>
        )}
      </div>
    </section>
  );
}

function findChipInState(steps: AnyStep[], chipId: string): Chip | null {
  for (const s of steps) {
    if (s.kind === 'action') {
      for (const f of s.fragments) if (f.kind === 'chip' && f.chip.id === chipId) return f.chip;
    } else if (s.kind === 'condition') {
      for (const b of s.branches) for (const bs of b.steps) {
        if (bs.kind === 'action') for (const f of bs.fragments) if (f.kind === 'chip' && f.chip.id === chipId) return f.chip;
      }
    }
  }
  return null;
}

/* ============================================================ */
/* Slash picker (popup at caret with action list)                 */
/* ============================================================ */
function SlashPicker({
  state, onPick, onClose,
}: {
  state: ReturnType<typeof useCanvasState>;
  onPick: (actionId: string) => void;
  onClose: () => void;
}) {
  const slash = state.slash!;
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // autofocus the picker input
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    const q = slash.query.trim().toLowerCase();
    if (!q) return ACTIONS;
    return ACTIONS.filter((a) =>
      a.name.toLowerCase().includes(q) ||
      a.verb.toLowerCase().includes(q) ||
      a.bucket.toLowerCase().includes(q)
    );
  }, [slash.query]);

  const grouped = useMemo(() => {
    return BUCKET_ORDER.reduce<Record<Bucket, typeof ACTIONS>>((acc, b) => {
      acc[b] = filtered.filter((a) => a.bucket === b);
      return acc;
    }, {} as Record<Bucket, typeof ACTIONS>);
  }, [filtered]);

  const flat = useMemo(() => Object.values(grouped).flat(), [grouped]);

  useEffect(() => {
    if (idx >= flat.length) setIdx(Math.max(0, flat.length - 1));
  }, [flat.length, idx]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIdx((i) => Math.min(flat.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const a = flat[idx];
      if (a) onPick(a.id);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Position so popup top doesn't overflow viewport
  const top = Math.min(slash.anchor.top, window.innerHeight - 360);

  return (
    <div
      className={styles.slashPicker}
      data-slash-picker="true"
      style={{ top, left: slash.anchor.left }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className={styles.slashHead}>
        <span className={styles.slashHint}>Insert action</span>
        <span className={styles.slashKbdHint}>↑↓ to navigate · ↩ select · esc close</span>
      </div>
      <input
        ref={inputRef}
        className={styles.slashInput}
        placeholder="Type to filter…"
        value={slash.query}
        onChange={(e) => state.updateSlashQuery(e.target.value)}
        onKeyDown={handleKey}
      />
      <div className={styles.slashList}>
        {flat.length === 0 && (
          <div className={styles.slashEmpty}>No actions match &quot;{slash.query}&quot;.</div>
        )}
        {BUCKET_ORDER.map((b) => {
          const items = grouped[b];
          if (!items.length) return null;
          return (
            <div key={b} className={styles.slashBucket}>
              <div className={styles.slashBucketLabel}>{BUCKET_TITLES[b]}</div>
              {items.map((a) => {
                const globalIdx = flat.findIndex((x) => x.id === a.id);
                const active = globalIdx === idx;
                const Icon = ICONS[a.iconKey];
                return (
                  <button
                    key={a.id}
                    className={`${styles.slashItem} ${active ? styles.slashItemActive : ''}`}
                    onClick={() => onPick(a.id)}
                    onMouseEnter={() => setIdx(globalIdx)}
                    data-slash-action={a.id}
                    type="button"
                  >
                    <span className={styles.slashItemIco}>{Icon ? <Icon /> : null}</span>
                    <span className={styles.slashItemText}>
                      {a.brand && <span className={styles.slashItemBrand}>{a.brand} · </span>}
                      <span className={styles.slashItemName}>{a.verb}</span>
                    </span>
                    <span className={styles.slashItemDesc}>{a.desc}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================ */
/* Ref picker (@ menu)                                            */
/* ============================================================ */
function RefPicker({
  state, onPick, onClose,
}: {
  state: ReturnType<typeof useCanvasState>;
  onPick: (refPath: string) => void;
  onClose: () => void;
}) {
  const rp = state.refPicker!;
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    const q = rp.query.trim().toLowerCase();
    if (!q) return REFS;
    return REFS.filter((r) =>
      r.path.toLowerCase().includes(q) ||
      r.label.toLowerCase().includes(q) ||
      r.group.toLowerCase().includes(q)
    );
  }, [rp.query]);

  const groups: ('ticket' | 'inputs' | 'outputs')[] = ['ticket', 'inputs', 'outputs'];
  const grouped = useMemo(() => {
    return groups.reduce<Record<string, typeof REFS>>((acc, g) => {
      acc[g] = filtered.filter((r) => r.group === g);
      return acc;
    }, {});
  }, [filtered]);

  const flat = useMemo(() => groups.flatMap((g) => grouped[g] || []), [grouped]);

  useEffect(() => {
    if (idx >= flat.length) setIdx(Math.max(0, flat.length - 1));
  }, [flat.length, idx]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(flat.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const r = flat[idx];
      if (r) onPick(r.path);
    } else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
  };

  const top = Math.min(rp.anchor.top, window.innerHeight - 360);

  return (
    <div
      className={styles.slashPicker}
      data-slash-picker="true"
      data-ref-picker="true"
      style={{ top, left: rp.anchor.left }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className={styles.slashHead}>
        <span className={styles.slashHint}>Insert reference</span>
        <span className={styles.slashKbdHint}>↑↓ to navigate · ↩ select · esc close</span>
      </div>
      <input
        ref={inputRef}
        className={styles.slashInput}
        placeholder="Search refs…"
        value={rp.query}
        onChange={(e) => state.updateRefQuery(e.target.value)}
        onKeyDown={handleKey}
      />
      <div className={styles.slashList}>
        {flat.length === 0 && (
          <div className={styles.slashEmpty}>No refs match &quot;{rp.query}&quot;.</div>
        )}
        {groups.map((g) => {
          const items = grouped[g] || [];
          if (!items.length) return null;
          return (
            <div key={g} className={styles.slashBucket}>
              <div className={styles.slashBucketLabel}>{g}</div>
              {items.map((r) => {
                const globalIdx = flat.findIndex((x) => x.path === r.path);
                const active = globalIdx === idx;
                return (
                  <button
                    key={r.path}
                    className={`${styles.slashItem} ${active ? styles.slashItemActive : ''}`}
                    onClick={() => onPick(r.path)}
                    onMouseEnter={() => setIdx(globalIdx)}
                    data-ref-path={r.path}
                    type="button"
                  >
                    <span className={styles.slashItemIco} />
                    <span className={styles.slashItemText}>
                      <span className={styles.slashItemBrand}>{r.label} · </span>
                      <span className={styles.slashItemName} style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{`{{${r.path}}}`}</span>
                    </span>
                    <span className={styles.slashItemDesc}>{r.type}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================ */
/* Overflow menu                                                  */
/* ============================================================ */
function OverflowMenu({
  onClose, onEnterCleanWipe, onReset,
}: { onClose: () => void; onEnterCleanWipe: () => void; onReset: () => void }) {
  return (
    <div className={styles.overflowMenu}>
      <button className={styles.overflowItem} onClick={() => { onEnterCleanWipe(); onClose(); }} type="button">
        <span className={styles.overflowItemIco}><RiRefreshLine /></span>
        <span className={styles.overflowItemMain}>
          <span className={styles.overflowItemName}>Clean Wipe Test mode</span>
          <span className={styles.overflowItemHint}>Wipe steps, keep Frontmatter, restore on exit</span>
        </span>
      </button>
      <button className={styles.overflowItem} onClick={() => { onReset(); onClose(); }} type="button">
        <span className={styles.overflowItemIco}><RiSparklingLine /></span>
        <span className={styles.overflowItemMain}>
          <span className={styles.overflowItemName}>Reset to seed</span>
          <span className={styles.overflowItemHint}>Discard all changes and reload Walk Japan</span>
        </span>
      </button>
      <div className={styles.overflowDivider} />
      <button className={styles.overflowItem} disabled type="button">
        <span className={styles.overflowItemIco} />
        <span className={styles.overflowItemMain}>
          <span className={styles.overflowItemName}>Export<span className={styles.overflowItemTag}>v2</span></span>
        </span>
      </button>
      <button className={styles.overflowItem} disabled type="button">
        <span className={styles.overflowItemIco} />
        <span className={styles.overflowItemMain}>
          <span className={styles.overflowItemName}>Settings<span className={styles.overflowItemTag}>v2</span></span>
        </span>
      </button>
    </div>
  );
}

/* ============================================================ */
/* Activate dropdown                                              */
/* ============================================================ */
function ActivateDropdown({
  state, onClose,
}: { state: ReturnType<typeof useCanvasState>; onClose: () => void }) {
  const [selected, setSelected] = useState<Record<string, boolean>>({
    'info@walkjapan.com': state.activation.status === 'live' && state.activation.mailboxes.includes('info@walkjapan.com'),
    'sales@walkjapan.com': false,
    'tours@walkjapan.com': false,
  });
  const [publishing, setPublishing] = useState(false);
  const isLive = state.activation.status === 'live';
  // default to info@ being selected if nothing else
  const allEmpty = !Object.values(selected).some(Boolean);
  if (allEmpty && !isLive) selected['info@walkjapan.com'] = true;

  const handlePublish = () => {
    const mailboxes = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);
    if (!mailboxes.length) return;
    setPublishing(true);
    state.setActivation({ status: 'publishing', mailboxes });
    window.setTimeout(() => {
      state.setActivation({ status: 'live', mailboxes });
      setPublishing(false);
      onClose();
    }, 1500);
  };

  const handleStop = () => {
    state.setActivation({ status: 'draft' });
    onClose();
  };

  return (
    <div className={styles.activateDropdown}>
      <div className={styles.activateHead}>{isLive ? 'Activated on' : 'Activate for'}</div>
      <div className={styles.activateList}>
        {Object.entries(selected).map(([mailbox, v]) => (
          <label key={mailbox} className={styles.activateRow}>
            <input
              type="checkbox"
              checked={v}
              onChange={(e) => setSelected((s) => ({ ...s, [mailbox]: e.target.checked }))}
            />
            <span>{mailbox}</span>
          </label>
        ))}
      </div>
      <div className={styles.activateValidation}>Validation: 0 issues. Ready to publish.</div>
      {isLive ? (
        <>
          <button className={styles.activateUpdate} disabled={publishing} onClick={handlePublish} type="button">
            {publishing ? 'Updating…' : 'Update'}
          </button>
          <button className={styles.activateStop} onClick={handleStop} type="button">Stop activating</button>
        </>
      ) : (
        <button className={styles.activatePublish} disabled={publishing} onClick={handlePublish} type="button">
          {publishing ? 'Publishing…' : `Publish ${Object.values(selected).filter(Boolean).length} mailbox${Object.values(selected).filter(Boolean).length === 1 ? '' : 'es'}`}
        </button>
      )}
    </div>
  );
}

/* ============================================================ */
/* Test banner                                                    */
/* ============================================================ */
function TestBanner({ state }: { state: ReturnType<typeof useCanvasState> }) {
  if (state.mode === 'test-idle') {
    return (
      <div className={styles.testBanner} data-mode="idle">
        <span className={styles.testBannerLabel}>Test mode</span>
        <span className={styles.testBannerSub}>Mock data · no real actions fire</span>
        <span className={styles.spacer} />
        <button className={styles.testBannerRun} onClick={state.runTest} type="button">
          <RiPlayLine /> Run test
        </button>
      </div>
    );
  }
  if (state.mode === 'test-running') {
    return (
      <div className={styles.testBanner} data-mode="running">
        <span className={styles.testBannerLabel}><span className={styles.pillDotRun} /> Running test</span>
        <span className={styles.testBannerSub}>Step {state.trace.length + 1} executing…</span>
      </div>
    );
  }
  if (state.mode === 'test-done') {
    const passed = state.testOutcome === 'pass';
    return (
      <div className={styles.testBanner} data-mode={passed ? 'done-ok' : state.testOutcome === 'cancelled' ? 'done-cancelled' : 'done-err'}>
        <span className={styles.testBannerLabel}>
          {passed ? <><span className={styles.pillDotOk} /> Test passed</> :
           state.testOutcome === 'cancelled' ? 'Test cancelled' :
           <><span className={styles.pillDotErr} /> Test failed</>}
        </span>
        <span className={styles.testBannerSub}>{state.trace.length} steps recorded</span>
      </div>
    );
  }
  return null;
}

/* ============================================================ */
/* Validation strip                                               */
/* ============================================================ */
function ValidationStrip({ state }: { state: ReturnType<typeof useCanvasState> }) {
  const issues: { label: string; targetSel: string }[] = [];
  if (!state.playbook.frontmatter.name.trim()) {
    issues.push({ label: 'Playbook name is required', targetSel: 'h1[contenteditable]' });
  }
  if (!state.playbook.frontmatter.triggerFragments.length) {
    issues.push({ label: 'WHEN trigger must include at least one filter', targetSel: '[class*="fmTrigger"]' });
  }
  if (!issues.length) return null;
  return (
    <div className={styles.validationStrip}>
      <span className={styles.validationCount}>{issues.length} issue{issues.length === 1 ? '' : 's'}</span>
      <span className={styles.validationFirst}>{issues[0]!.label}</span>
      <button
        className={styles.validationResolve}
        type="button"
        onClick={() => {
          const el = document.querySelector(issues[0]!.targetSel);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add(styles.targetPulse!);
            window.setTimeout(() => el.classList.remove(styles.targetPulse!), 1200);
          }
        }}
      >Resolve</button>
    </div>
  );
}

/* ============================================================ */
/* Page                                                           */
/* ============================================================ */
type DragKind = 'step' | 'action' | null;

export default function CanvasPage() {
  const state = useCanvasState();
  const [paletteQuery, setPaletteQuery] = useState('');
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [activateOpen, setActivateOpen] = useState(false);
  const configPanelRef = useRef<HTMLElement | null>(null);
  const [highlightStepId, setHighlightStepId] = useState<string | null>(null);

  // Drag-and-drop state (local UI only, not persisted)
  const [dragKind, setDragKind] = useState<DragKind>(null);
  const [dragStepId, setDragStepId] = useState<string | null>(null);
  const [dragActionId, setDragActionId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropAtEnd, setDropAtEnd] = useState(false);

  const clearDrag = () => {
    setDragKind(null);
    setDragStepId(null);
    setDragActionId(null);
    setDropTargetId(null);
    setDropAtEnd(false);
  };

  // Outside-click for Configure panel
  useEffect(() => {
    if (!state.configChipId) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (configPanelRef.current?.contains(target)) return;
      const t = target as Element;
      if (t.closest?.('[data-chip-id]')) return;
      state.setConfigChipId(null);
    };
    const id = window.setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener('mousedown', handler);
    };
  }, [state.configChipId, state]);

  // Outside-click for overflow + activate
  useEffect(() => {
    if (!overflowOpen) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (!t?.closest?.(`.${styles.overflowMenu}`) && !t?.closest?.('[title="More"]')) {
        setOverflowOpen(false);
      }
    };
    const id = window.setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => { window.clearTimeout(id); document.removeEventListener('mousedown', handler); };
  }, [overflowOpen]);

  useEffect(() => {
    if (!activateOpen) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (!t?.closest?.(`.${styles.activateDropdown}`) && !t?.closest?.(`.${styles.activateBtn}`)) {
        setActivateOpen(false);
      }
    };
    const id = window.setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => { window.clearTimeout(id); document.removeEventListener('mousedown', handler); };
  }, [activateOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (e.key === 'Escape') {
        state.setConfigChipId(null);
        setOverflowOpen(false);
        setActivateOpen(false);
        return;
      }
      if (meta && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        state.undo();
      }
      if (meta && (e.key === 'Z' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        state.redo();
      }
      if (meta && e.key === 'Enter' && state.mode === 'test-idle') {
        e.preventDefault();
        state.runTest();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [state]);

  const configChip = state.configChipId ? findChipInState(state.playbook.steps, state.configChipId) : null;

  const scrollToStep = (stepId: string) => {
    const el = document.querySelector(`[data-step-id="${stepId}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightStepId(stepId);
    window.setTimeout(() => setHighlightStepId((c) => (c === stepId ? null : c)), 1200);
  };

  const handleReset = () => {
    if (window.confirm('Reset playbook to Walk Japan seed? This will discard all changes.')) {
      window.location.reload();
    }
  };

  const inTest = state.mode === 'test-idle' || state.mode === 'test-running' || state.mode === 'test-done';
  const inCleanWipe = state.mode === 'clean-wipe';

  // Build statuses map for chip rendering
  const statuses: Record<string, ChipStatus> = state.chipStatusOverride;

  // Number the steps + compute last action-step index for capping move-down
  const { stepNumbers, lastActionableIdx } = useMemo(() => {
    let n = 0;
    const nums: string[] = [];
    let lastIdx = -1;
    state.playbook.steps.forEach((s, i) => {
      if (s.kind === 'end') { nums.push('end'); }
      else { n += 1; nums.push(String(n).padStart(2, '0')); lastIdx = i; }
    });
    return { stepNumbers: nums, lastActionableIdx: lastIdx };
  }, [state.playbook.steps]);

  const inTestMode = state.mode === 'test-idle' || state.mode === 'test-running' || state.mode === 'test-done';
  const editable = state.mode === 'edit' || state.mode === 'clean-wipe';

  return (
    <div className={styles.page}>
      <Topbar
        state={state}
        onOpenOverflow={() => { setOverflowOpen((v) => !v); setActivateOpen(false); }}
        overflowOpen={overflowOpen}
        onOpenActivate={() => { setActivateOpen((v) => !v); setOverflowOpen(false); }}
        activateOpen={activateOpen}
      />
      {overflowOpen && (
        <OverflowMenu
          onClose={() => setOverflowOpen(false)}
          onEnterCleanWipe={state.enterCleanWipe}
          onReset={handleReset}
        />
      )}
      {activateOpen && (
        <ActivateDropdown state={state} onClose={() => setActivateOpen(false)} />
      )}

      <main
        className={styles.main}
        data-mode={state.mode}
        data-config-open={configChip ? 'true' : 'false'}
        data-trace-open={inTest ? 'true' : 'false'}
      >
        <LeftPalette
          collapsed={state.paletteCollapsed}
          onToggle={state.togglePalette}
          onInsert={state.insertAction}
          query={paletteQuery}
          setQuery={setPaletteQuery}
          onDragActionStart={(id) => { setDragKind('action'); setDragActionId(id); }}
          onDragActionEnd={clearDrag}
        />

        <section className={styles.canvasArea}>
          {inTest && <TestBanner state={state} />}
          <div className={styles.canvasScroll}>
            <div className={styles.canvasScrollInner}>
              <FrontmatterCard state={state} />
              <div
                className={styles.stepList}
                onDragOver={(e) => {
                  // allow drop on empty list area to insert at end
                  if (dragKind) { e.preventDefault(); }
                }}
                onDrop={(e) => {
                  if (!dragKind) return;
                  e.preventDefault();
                  if (dragKind === 'action' && dragActionId) {
                    state.insertAction(dragActionId);
                  }
                  clearDrag();
                }}
              >
                {editable && lastActionableIdx === -1 && (
                  <button
                    className={styles.addStepBtn}
                    onClick={() => state.insertEmptyStep()}
                    type="button"
                  >
                    <RiAddLine /> Add the first step
                  </button>
                )}
                {state.playbook.steps.map((step, i) => {
                  const isLastBeforeEnd = i === lastActionableIdx;
                  const showAddBelow = editable && isLastBeforeEnd;
                  const isDragging = dragKind === 'step' && dragStepId === step.id;
                  const isDropTarget = dropTargetId === step.id;

                  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
                    if (!editable || step.kind === 'end') {
                      e.preventDefault();
                      return;
                    }
                    setDragKind('step');
                    setDragStepId(step.id);
                    e.dataTransfer.effectAllowed = 'move';
                    try { e.dataTransfer.setData('text/plain', step.id); } catch {}
                  };
                  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
                    if (!dragKind) return;
                    if (dragKind === 'step' && dragStepId === step.id) return; // can't drop on self
                    e.preventDefault();
                    e.dataTransfer.dropEffect = dragKind === 'step' ? 'move' : 'copy';
                    setDropTargetId(step.id);
                    setDropAtEnd(false);
                  };
                  const handleDragLeave = () => {};
                  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
                    if (!dragKind) return;
                    e.preventDefault();
                    e.stopPropagation();
                    if (dragKind === 'step' && dragStepId) {
                      state.moveStepToIndex(dragStepId, i);
                    } else if (dragKind === 'action' && dragActionId) {
                      // insert AFTER the dropped-on step
                      state.insertAction(dragActionId, step.id);
                    }
                    clearDrag();
                  };

                  return (
                    <div
                      key={step.id}
                      className={`${styles.stepRowWrap} ${isDragging ? styles.dragging : ''} ${isDropTarget ? styles.dropTarget : ''}`}
                      draggable={editable && step.kind !== 'end'}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onDragEnd={clearDrag}
                    >
                      <StepRow
                        step={step}
                        num={stepNumbers[i] ?? '—'}
                        statuses={statuses}
                        onChipClick={(id) => state.setConfigChipId(id)}
                        selectedChipId={state.configChipId}
                        highlight={highlightStepId === step.id}
                        editable={editable && step.kind !== 'end'}
                        onFragmentsChange={(id, fragments) => state.setStepFragments(id, fragments)}
                        onSlash={(id, anchor, offset) => state.openSlash({ stepId: id, anchor, textOffset: offset, query: '' })}
                        onAt={(id, anchor, offset) => state.openRef({ target: id, anchor, textOffset: offset, query: '' })}
                        actions={
                          editable && step.kind !== 'end'
                            ? {
                                onUp:        () => state.moveStepUp(step.id),
                                onDown:      () => state.moveStepDown(step.id),
                                onDuplicate: () => state.duplicateStep(step.id),
                                onDelete:    () => state.removeStep(step.id),
                              }
                            : undefined
                        }
                        condActions={
                          editable && step.kind === 'condition'
                            ? {
                                onAddBranch:        () => state.addBranch(step.id),
                                onRemoveBranch:     (bid) => state.removeBranch(step.id, bid),
                                onAddStepInBranch:  (bid) => state.addStepInBranch(step.id, bid),
                                onRemoveSub:        (bid, sid) => state.removeStepInBranch(step.id, bid, sid),
                                onMoveSubUp:        (bid, sid) => state.moveStepInBranch(step.id, bid, sid, -1),
                                onMoveSubDown:      (bid, sid) => state.moveStepInBranch(step.id, bid, sid, 1),
                                onSetSubFragments:  (bid, sid, frags) => state.setStepFragmentsInBranch(step.id, bid, sid, frags),
                              }
                            : undefined
                        }
                        canUp={i > 0}
                        canDown={i < lastActionableIdx}
                      />
                      {showAddBelow && (
                        <button
                          className={styles.addStepBtn}
                          onClick={() => state.insertEmptyStep(step.id)}
                          type="button"
                        >
                          <RiAddLine /> Add step
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          {inTest && <TracePanel state={state} scrollToStep={scrollToStep} />}
        </section>

        {configChip && (
          <ConfigurePanel chip={configChip} state={state} panelRef={configPanelRef} />
        )}
      </main>

      <ValidationStrip state={state} />

      {state.slash && (
        <SlashPicker
          state={state}
          onClose={state.closeSlash}
          onPick={(actionId) => {
            const s = state.slash!;
            state.insertChipInStepAtOffset(s.stepId, actionId, s.textOffset);
            state.closeSlash();
          }}
        />
      )}

      {state.refPicker && (
        <RefPicker
          state={state}
          onClose={state.closeRef}
          onPick={(refPath) => {
            const rp = state.refPicker!;
            if (rp.target === 'trigger') {
              state.insertRefInTriggerAtOffset(refPath, rp.textOffset);
            } else {
              state.insertRefInStepAtOffset(rp.target, refPath, rp.textOffset);
            }
            state.closeRef();
          }}
        />
      )}
    </div>
  );
}
