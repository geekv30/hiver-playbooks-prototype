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
  ACTIONS, BUCKET_TITLES, BUCKET_HINTS, BUCKET_ORDER,
  ICONS, findAction, type Bucket, type Chip, type AnyStep, type Frag, type ChipStatus,
} from './data';
import { useCanvasState, getChipStatus } from './state';
import { ConfigureBody } from './bodies';

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
  if (frag.kind === 'text') return <span>{frag.text}</span>;
  if (frag.kind === 'ref')  return <span className={styles.refchip}>{frag.refPath}</span>;
  if (frag.kind === 'code') return <code className={styles.codeFrag}>{frag.code}</code>;
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
    <span className={cls} onClick={onClick} data-chip-id={chip.id} tabIndex={0}>
      <span className={styles.chipIco}>{Icon ? <Icon /> : null}</span>
      {action.brand && (
        <>
          <span className={styles.chipBrand}>{action.brand}</span>
          <span className={styles.chipSep}>·</span>
        </>
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
  onUp: () => void;
  onDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <span className={styles.stepActions} data-step-actions-for={stepId} onClick={(e) => e.stopPropagation()}>
      <button
        className={`${styles.stepActionBtn} ${!canUp ? styles.stepActionBtnDisabled : ''}`}
        onClick={onUp}
        disabled={!canUp}
        title="Move up"
        type="button"
      ><RiArrowUpSLine /></button>
      <button
        className={`${styles.stepActionBtn} ${!canDown ? styles.stepActionBtnDisabled : ''}`}
        onClick={onDown}
        disabled={!canDown}
        title="Move down"
        type="button"
      ><RiArrowDownLine /></button>
      <button className={styles.stepActionBtn} onClick={onDuplicate} title="Duplicate" type="button">
        <RiFileCopyLine />
      </button>
      <button className={`${styles.stepActionBtn} ${styles.stepActionBtnDanger}`} onClick={onDelete} title="Delete" type="button">
        <RiDeleteBinLine />
      </button>
    </span>
  );
}

function StepRow({
  step, num, statuses, onChipClick, selectedChipId, highlight,
  actions, canUp, canDown,
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
}) {
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
          <span className={styles.condLabel}>Condition</span>
          <span className={styles.condExpr}>{step.exprText}</span>
          <div className={styles.branches}>
            {step.branches.map((b, bi) => (
              <div key={b.id} className={styles.branch}>
                <div className={styles.branchHead}>
                  <span className={styles.branchLabel}>{`${String(bi + 1).padStart(2, '0')}.${b.label}`}</span>
                  {b.predicate && <code className={styles.branchPredInline}>{b.predicate}</code>}
                </div>
                {b.steps.map((bs, si) => {
                  if (bs.kind !== 'action') return null;
                  return (
                    <div key={bs.id} className={styles.branchSubrow} data-step-id={bs.id}>
                      <span className={styles.branchSubnum}>{`${num}${String.fromCharCode(96 + si + 1)}`}</span>
                      <span className={styles.branchSubbody}>
                        {bs.fragments.map((f, fi) => (
                          <FragmentSpan
                            key={fi}
                            frag={f}
                            status={f.kind === 'chip' ? statuses[f.chip.id] : undefined}
                            onChipClick={onChipClick}
                            selected={f.kind === 'chip' && f.chip.id === selectedChipId}
                          />
                        ))}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
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
                   !step.fragments.some((f) => f.kind === 'text' && f.text.trim().length > 0);
  return (
    <div className={`${styles.stepRow} ${highlight ? styles.stepHighlight : ''} ${isEmpty ? styles.stepEmpty : ''}`} data-step-id={step.id}>
      <span className={styles.stepDot}><StatusDot status={isEmpty ? 'draft' : chipStatus} /></span>
      <span className={styles.stepNum}>{num}</span>
      <span className={styles.stepBody}>
        {isEmpty ? (
          <span className={styles.emptyHint}>
            Pick an action from the palette to start, or press <kbd className={styles.kbd}>/</kbd> to insert here
          </span>
        ) : (
          step.fragments.map((f, fi) => (
            <FragmentSpan
              key={fi}
              frag={f}
              status={f.kind === 'chip' ? statuses[f.chip.id] : undefined}
              onChipClick={onChipClick}
              selected={f.kind === 'chip' && f.chip.id === selectedChipId}
            />
          ))
        )}
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
  collapsed, onToggle, onInsert, query, setQuery,
}: {
  collapsed: boolean;
  onToggle: () => void;
  onInsert: (id: string) => void;
  query: string;
  setQuery: (q: string) => void;
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
      <div className={styles.fmTrigger}>
        <span className={styles.triglabel} contentEditable={false}>WHEN</span>
        <span className={styles.fragRow}>
          {fm.triggerFragments.map((f, i) => (
            <FragmentSpan key={i} frag={f} />
          ))}
        </span>
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
              return (
                <button
                  key={i}
                  className={styles.traceRow}
                  data-status={entry.status}
                  onClick={() => scrollToStep(entry.stepId)}
                  type="button"
                >
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
export default function CanvasPage() {
  const state = useCanvasState();
  const [paletteQuery, setPaletteQuery] = useState('');
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [activateOpen, setActivateOpen] = useState(false);
  const configPanelRef = useRef<HTMLElement | null>(null);
  const [highlightStepId, setHighlightStepId] = useState<string | null>(null);

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
        />

        <section className={styles.canvasArea}>
          {inTest && <TestBanner state={state} />}
          <div className={styles.canvasScroll}>
            <div className={styles.canvasScrollInner}>
              <FrontmatterCard state={state} />
              <div className={styles.stepList}>
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
                  return (
                    <div key={step.id} className={styles.stepRowWrap}>
                      <StepRow
                        step={step}
                        num={stepNumbers[i] ?? '—'}
                        statuses={statuses}
                        onChipClick={(id) => state.setConfigChipId(id)}
                        selectedChipId={state.configChipId}
                        highlight={highlightStepId === step.id}
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
    </div>
  );
}
