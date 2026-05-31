'use client';
import { useState, useMemo, useCallback } from 'react';
import {
  RiPlayLine, RiStopCircleLine, RiRefreshLine, RiCheckLine, RiCloseLine,
  RiAddLine, RiArrowRightSLine, RiInboxLine,
} from 'react-icons/ri';
import styles from './TestPanel.module.css';
import type { useCanvasState } from './state';
import type { Scenario, CustomInput, PastInput, Run } from './test-fixtures';
import { FIXTURE_MAILBOX, findThread } from './test-fixtures';
import { PastConversationPicker } from './PastConversationPicker';

type State = ReturnType<typeof useCanvasState>;

/* ============================================================ */
/* TestPanel                                                      */
/* ============================================================ */
export function TestPanel({ state }: { state: State }) {
  return (
    <aside className={styles.panel} aria-label="Test panel">
      <header className={styles.head}>
        <button
          className={`${styles.tab} ${state.testRailTab === 'scenarios' ? styles.tabActive : ''}`}
          onClick={() => state.setTestRailTab('scenarios')}
          type="button"
        >
          Scenarios
        </button>
        <button
          className={`${styles.tab} ${state.testRailTab === 'batch' ? styles.tabActive : ''}`}
          onClick={() => state.setTestRailTab('batch')}
          type="button"
        >
          Batch
        </button>
        <button className={styles.closeBtn} onClick={state.exitTest} type="button" aria-label="Exit test">
          <RiCloseLine />
        </button>
      </header>

      <div className={styles.body}>
        {state.testRailTab === 'scenarios' ? <ScenariosTab state={state} /> : <BatchTab state={state} />}
      </div>

      <RunFooter state={state} />

      {state.pickerOpen && (
        <PastConversationPicker
          onPick={(threadId) => {
            const id = state.activeScenarioId;
            if (id) {
              const input: PastInput = { threadId };
              state.setScenarioMode(id, 'past', input);
            }
            state.setPickerOpen(false);
          }}
          onClose={() => state.setPickerOpen(false)}
        />
      )}
    </aside>
  );
}

/* ============================================================ */
/* Scenarios tab                                                  */
/* ============================================================ */
function ScenariosTab({ state }: { state: State }) {
  const active = state.scenarios.find((s) => s.id === state.activeScenarioId) || null;

  return (
    <div>
      <div className={styles.sectionLabel}>Scenarios</div>
      <div className={styles.scenList}>
        {state.scenarios.map((s) => (
          <ScenarioRow
            key={s.id}
            scenario={s}
            active={s.id === state.activeScenarioId}
            runs={state.runs[s.id] || []}
            onClick={() => state.selectScenario(s.id)}
            onDelete={() => {
              if (window.confirm(`Delete scenario "${s.name}"?`)) state.deleteScenario(s.id);
            }}
            onRename={() => {
              const name = window.prompt('Rename scenario', s.name);
              if (name && name.trim()) state.renameScenario(s.id, name.trim());
            }}
          />
        ))}
        <button
          className={styles.scenAdd}
          onClick={() => {
            const name = `Scenario ${state.scenarios.length + 1}`;
            const input: CustomInput = {
              from: '', subject: '', body: '', labels: [], attrs: {}, priorThread: [],
            };
            state.createScenario({ name, mode: 'custom', input });
          }}
          type="button"
        >
          <RiAddLine /> New scenario
        </button>
      </div>

      {active ? <InputPanelSection state={state} scenario={active} /> : (
        <div className={styles.empty}>Select a scenario to edit its input.</div>
      )}
    </div>
  );
}

function ScenarioRow({
  scenario, active, runs, onClick, onDelete, onRename,
}: {
  scenario: Scenario;
  active: boolean;
  runs: Run[];
  onClick: () => void;
  onDelete: () => void;
  onRename: () => void;
}) {
  const last = runs[0];
  const lastDotClass = last
    ? last.outcome === 'pass' ? styles.scenLastRunDot
      : last.outcome === 'fail' ? `${styles.scenLastRunDot} ${styles.scenLastRunDotFail}`
      : `${styles.scenLastRunDot} ${styles.scenLastRunDotCancelled}`
    : '';
  const lastLabel = last
    ? last.outcome === 'pass' ? 'passing'
      : last.outcome === 'fail' ? 'failing'
      : 'cancelled'
    : 'never run';

  return (
    <button
      className={`${styles.scenRow} ${active ? styles.scenRowActive : ''}`}
      onClick={onClick}
      type="button"
    >
      <span className={styles.scenRowName}>{scenario.name}</span>
      <span className={styles.scenLastRun}>
        {last && <span className={lastDotClass} />}
        {lastLabel}
      </span>
      <span
        className={styles.kebab}
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          const choice = window.prompt('Action: type "rename" or "delete"', '');
          if (choice === 'rename') onRename();
          else if (choice === 'delete') onDelete();
        }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.preventDefault(); }}
      >
        ⋯
      </span>
    </button>
  );
}

/* ============================================================ */
/* Input panel (custom or past)                                   */
/* ============================================================ */
function InputPanelSection({ state, scenario }: { state: State; scenario: Scenario }) {
  const [pendingModeSwitch, setPendingModeSwitch] = useState<'custom' | 'past' | null>(null);

  const switchMode = (mode: 'custom' | 'past') => {
    if (mode === scenario.mode) return;
    setPendingModeSwitch(mode);
  };

  const confirmModeSwitch = () => {
    if (!pendingModeSwitch) return;
    const blankInput = pendingModeSwitch === 'custom'
      ? { from: '', subject: '', body: '', labels: [], attrs: {}, priorThread: [] } as CustomInput
      : { threadId: '' } as PastInput;
    state.setScenarioMode(scenario.id, pendingModeSwitch, blankInput);
    setPendingModeSwitch(null);
  };

  return (
    <div>
      <div className={styles.sectionLabel}>Input</div>
      <div className={styles.modeSeg}>
        <button
          className={`${styles.modeSegBtn} ${scenario.mode === 'custom' ? styles.modeSegBtnActive : ''}`}
          onClick={() => switchMode('custom')}
          type="button"
        >
          Custom
        </button>
        <button
          className={`${styles.modeSegBtn} ${scenario.mode === 'past' ? styles.modeSegBtnActive : ''}`}
          onClick={() => switchMode('past')}
          type="button"
        >
          From inbox
        </button>
      </div>

      {pendingModeSwitch && (
        <div className={styles.modeWarn}>
          Switching modes discards the current input.{' '}
          <button
            className={styles.threadAction}
            onClick={confirmModeSwitch}
            type="button"
          >
            Switch
          </button>{' '}
          <button
            className={styles.threadAction}
            onClick={() => setPendingModeSwitch(null)}
            type="button"
          >
            Cancel
          </button>
        </div>
      )}

      {scenario.mode === 'custom' ? (
        <CustomInputForm state={state} scenario={scenario} />
      ) : (
        <PastInputView state={state} scenario={scenario} />
      )}
    </div>
  );
}

function CustomInputForm({ state, scenario }: { state: State; scenario: Scenario }) {
  const input = scenario.input as CustomInput;
  const [labelDraft, setLabelDraft] = useState('');

  const update = useCallback((patch: Partial<CustomInput>) => {
    state.updateScenarioInput(scenario.id, { ...input, ...patch });
  }, [state, scenario.id, input]);

  return (
    <div className={styles.inputBlock}>
      <div className={styles.field}>
        <label className={styles.fieldLabel}>From</label>
        <input
          className={styles.fieldInput}
          value={input.from}
          onChange={(e) => update({ from: e.target.value })}
          placeholder="alice@example.com"
          type="text"
        />
      </div>
      <div className={styles.field}>
        <label className={styles.fieldLabel}>Subject</label>
        <input
          className={styles.fieldInput}
          value={input.subject}
          onChange={(e) => update({ subject: e.target.value })}
          placeholder="Email subject"
          type="text"
        />
      </div>
      <div className={styles.field}>
        <label className={styles.fieldLabel}>Body</label>
        <textarea
          className={styles.fieldTextarea}
          value={input.body}
          onChange={(e) => update({ body: e.target.value })}
          placeholder="Email body"
          rows={4}
        />
      </div>
      <div className={styles.field}>
        <label className={styles.fieldLabel}>Labels</label>
        <div className={styles.labelPills}>
          {input.labels.map((l, i) => (
            <span key={`${l}-${i}`} className={styles.labelPill}>
              {l}
              <button
                className={styles.labelPillX}
                onClick={() => update({ labels: input.labels.filter((_, idx) => idx !== i) })}
                type="button"
                aria-label={`Remove ${l}`}
              >
                ×
              </button>
            </span>
          ))}
          <input
            className={styles.labelInput}
            value={labelDraft}
            onChange={(e) => setLabelDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                const v = labelDraft.trim().replace(/,$/, '');
                if (v && !input.labels.includes(v)) update({ labels: [...input.labels, v] });
                setLabelDraft('');
              }
            }}
            placeholder="add label..."
            type="text"
          />
        </div>
      </div>
    </div>
  );
}

function PastInputView({ state, scenario }: { state: State; scenario: Scenario }) {
  const input = scenario.input as PastInput;
  const thread = input.threadId ? findThread(input.threadId) : null;

  if (!thread) {
    return (
      <button
        className={styles.pickCTA}
        onClick={() => state.setPickerOpen(true)}
        type="button"
      >
        <span>Pick a thread from inbox</span>
        <span className={styles.pickCTASub}>Tests this playbook against a fixture thread.</span>
      </button>
    );
  }

  return (
    <div className={styles.threadCard}>
      <div className={styles.threadFrom}>{thread.fromName} &middot; <span style={{ color: 'var(--muted)' }}>{thread.from}</span></div>
      <div className={styles.threadSubj}>{thread.subject}</div>
      <div className={styles.threadBody}>{thread.body}</div>
      <div className={styles.threadLabels}>
        {thread.labels.map((l) => (
          <span key={l} className={styles.labelPill}>{l}</span>
        ))}
      </div>
      <div className={styles.threadActions}>
        <button className={styles.threadAction} onClick={() => state.setPickerOpen(true)} type="button">
          Pick another
        </button>
      </div>
    </div>
  );
}

/* ============================================================ */
/* Batch tab (v1: stubbed UI)                                     */
/* ============================================================ */
function BatchTab({ state }: { state: State }) {
  const [source, setSource] = useState<'scenarios' | 'inbox'>('scenarios');
  const [selected, setSelected] = useState<Set<string>>(() => new Set(state.scenarios.map((s) => s.id)));

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allOn = selected.size === state.scenarios.length;
  const count = source === 'scenarios' ? selected.size : 12;

  return (
    <div>
      <div className={styles.sectionLabel}>Batch source</div>
      <div className={styles.batchSource}>
        <button
          className={`${styles.batchSourceBtn} ${source === 'scenarios' ? styles.batchSourceBtnActive : ''}`}
          onClick={() => setSource('scenarios')}
          type="button"
        >
          Saved scenarios
        </button>
        <button
          className={`${styles.batchSourceBtn} ${source === 'inbox' ? styles.batchSourceBtnActive : ''}`}
          onClick={() => setSource('inbox')}
          type="button"
        >
          From inbox
        </button>
      </div>

      {source === 'scenarios' ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span className={styles.sectionLabel} style={{ margin: 0 }}>Selected ({selected.size})</span>
            <button
              className={styles.batchAll}
              onClick={() => setSelected(allOn ? new Set() : new Set(state.scenarios.map((s) => s.id)))}
              type="button"
            >
              {allOn ? 'Select none' : 'Select all'}
            </button>
          </div>
          <div className={styles.batchScenList}>
            {state.scenarios.map((s) => {
              const checked = selected.has(s.id);
              return (
                <button
                  key={s.id}
                  className={styles.batchScenRow}
                  onClick={() => toggle(s.id)}
                  type="button"
                >
                  <span className={`${styles.batchCheckbox} ${checked ? styles.batchCheckboxChecked : ''}`}>
                    {checked ? '✓' : ''}
                  </span>
                  <span>{s.name}</span>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <div className={styles.batchHelper}>
          Filter the fixture mailbox by labels, date, or search.{' '}
          <strong style={{ color: 'var(--ink)' }}>{FIXTURE_MAILBOX.length} threads</strong> available.
          (Filter UI ships in v2.1.)
        </div>
      )}

      <button
        className={styles.footRunPrimary}
        style={{ width: '100%' }}
        onClick={() => {
          window.alert(`Batch runner stubbed for v1. Would run ${count} test(s) sequentially.\n\nv2.1 will add: progressive results table, branch coverage, drill-down trace.`);
        }}
        disabled={count === 0}
        type="button"
      >
        <RiPlayLine /> Run {count} test{count === 1 ? '' : 's'}
      </button>
    </div>
  );
}

/* ============================================================ */
/* Footer / run controls                                          */
/* ============================================================ */
function RunFooter({ state }: { state: State }) {
  const scenario = state.scenarios.find((s) => s.id === state.activeScenarioId) || null;
  const customValid = useMemo(() => {
    if (!scenario || scenario.mode !== 'custom') return true;
    const inp = scenario.input as CustomInput;
    return inp.from.trim() && inp.subject.trim() && inp.body.trim();
  }, [scenario]);
  const pastValid = useMemo(() => {
    if (!scenario || scenario.mode !== 'past') return true;
    return Boolean((scenario.input as PastInput).threadId);
  }, [scenario]);
  const valid = customValid && pastValid && scenario != null;

  // test-* states map to different footer contents
  if (state.mode === 'test-running') {
    return (
      <footer className={styles.foot}>
        <button className={styles.footStop} onClick={state.stopTest} type="button">
          <RiStopCircleLine /> Stop
        </button>
        <span className={styles.footStatus}>running…</span>
      </footer>
    );
  }

  if (state.mode === 'test-done') {
    const outcomeLabel = state.testOutcome === 'pass' ? 'Passed' : state.testOutcome === 'fail' ? 'Failed' : 'Cancelled';
    const outcomeClass = state.testOutcome === 'pass' ? styles.footPass : state.testOutcome === 'fail' ? styles.footFail : '';
    return (
      <footer className={styles.foot}>
        <button className={styles.footGhost} onClick={state.replayTest} type="button">
          <RiRefreshLine /> Replay
        </button>
        <button
          className={styles.footGhost}
          onClick={() => {
            const runs = state.activeScenarioId ? (state.runs[state.activeScenarioId] ?? []) : [];
            if (runs.length < 2) {
              window.alert('Need at least 2 runs to compare. Run the scenario again first.');
              return;
            }
            state.enterDiff(runs[0]!.id, runs[1]!.id);
          }}
          type="button"
        >
          <RiArrowRightSLine /> Compare
        </button>
        <span className={`${styles.footStatus} ${outcomeClass}`}>{outcomeLabel}</span>
      </footer>
    );
  }

  if (state.mode === 'test-diff') {
    return (
      <footer className={styles.foot}>
        <button className={styles.footRunPrimary} onClick={state.exitDiff} type="button">
          <RiCloseLine /> Exit diff
        </button>
      </footer>
    );
  }

  // test-idle (default)
  return (
    <footer className={styles.foot}>
      <button
        className={styles.footRunPrimary}
        onClick={state.runTest}
        disabled={!valid}
        type="button"
        title={!valid ? 'Add From / Subject / Body to enable Run' : 'Run test (Cmd+Enter)'}
      >
        <RiPlayLine /> Run test
      </button>
    </footer>
  );
}
