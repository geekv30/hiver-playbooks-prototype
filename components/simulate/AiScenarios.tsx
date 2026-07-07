'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { RiRefreshLine } from 'react-icons/ri';
import { SIM_SCENARIOS, type SimStatusKind } from '@/data/simFixtures';
import Spinner from '@/components/atoms/Spinner';
import EvalBackHeader from './EvalBackHeader';
import { EVAL_ICONS, EVAL_TITLES } from './EvalMenu';
import PickableEmailCard from './PickableEmailCard';
import ScenariosEmpty from './ScenariosEmpty';
import ComposeEval from './ComposeEval';
import styles from './AiScenarios.module.css';

interface Props {
  /** False when the AOP has no trigger yet - shows the informative empty state. */
  hasScenarios?: boolean;
  hasTrigger?: boolean;
  onAddTrigger?: () => void;
  /** Leave the flow back to the Evaluate menu. */
  onExit: () => void;
  /** Report a completed run's status up to the canvas (the eval aggregate). */
  onRunRecorded?: (statuses: SimStatusKind[]) => void;
  /** Open the Copilot tab (Fix with Copilot on a caught gap). */
  onOpenCopilot?: () => void;
}

/**
 * AiScenarios - the AI scenarios flow (Figma 1752:20293 / 1752:21176). A single
 * FLAT list (topic grouping removed) of single-select scenario emails with a
 * Regenerate action. Choosing one drops its email into an editable field
 * (ComposeEval), where it can be tweaked before Start Evaluation. Back always
 * lives on top; the Copilot | Evaluation tabs stay pinned above this header.
 */
export default function AiScenarios({
  hasScenarios = true,
  hasTrigger = false,
  onAddTrigger,
  onExit,
  onRunRecorded,
  onOpenCopilot,
}: Props) {
  const [mode, setMode] = useState<'list' | 'compose'>('list');
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [gen, setGen] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  // Rotate the flat list so a regenerate visibly reshuffles the scenarios (mock).
  const k = gen % SIM_SCENARIOS.length;
  const scenarios = [...SIM_SCENARIOS.slice(k), ...SIM_SCENARIOS.slice(0, k)];
  const chosen = SIM_SCENARIOS.find((s) => s.id === chosenId) ?? null;

  const regenerate = () => {
    if (regenerating) return;
    setChosenId(null);
    setRegenerating(true);
    timer.current = setTimeout(() => {
      setGen((g) => g + 1);
      setRegenerating(false);
    }, 700);
  };

  const icon = EVAL_ICONS.scenarios;

  // No trigger yet -> the informative empty state (no list, no regenerate).
  if (!hasScenarios) {
    return (
      <div className={styles.scenarios}>
        <EvalBackHeader title={EVAL_TITLES.scenarios} icon={icon} onBack={onExit} />
        <div className={styles.scroll}>
          <ScenariosEmpty hasTrigger={hasTrigger} onAddTrigger={onAddTrigger} />
        </div>
      </div>
    );
  }

  if (mode === 'compose' && chosen) {
    return (
      <div className={styles.scenarios}>
        <EvalBackHeader title={EVAL_TITLES.scenarios} icon={icon} onBack={() => setMode('list')} />
        <ComposeEval
          initialBody={chosen.body ?? chosen.preview}
          placeholder="Edit this scenario's email, then start the evaluation"
          seed={chosen}
          onRunRecorded={onRunRecorded}
          onOpenCopilot={onOpenCopilot}
        />
      </div>
    );
  }

  return (
    <div className={styles.scenarios}>
      <EvalBackHeader
        title={EVAL_TITLES.scenarios}
        icon={icon}
        onBack={onExit}
        action={
          <button type="button" className={styles.regen} onClick={regenerate} disabled={regenerating}>
            <RiRefreshLine aria-hidden data-spin={regenerating || undefined} />
            <span>Regenerate</span>
          </button>
        }
      />

      {regenerating ? (
        <div className={styles.loading}>
          <Spinner size={18} />
          <p className={styles.loadingText}>Generating scenarios…</p>
        </div>
      ) : (
        <div className={styles.list} role="radiogroup" aria-label="AI test scenarios" key={gen}>
          {scenarios.map((s, i) => (
            <div key={s.id} className={styles.cardReveal} style={{ '--i': i } as CSSProperties}>
              <PickableEmailCard
                email={s}
                selected={chosenId === s.id}
                onSelect={() => setChosenId(s.id)}
              />
            </div>
          ))}
        </div>
      )}

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.chooseBtn}
          data-ready={!!chosenId || undefined}
          disabled={!chosenId}
          onClick={() => setMode('compose')}
        >
          Choose
        </button>
      </div>
    </div>
  );
}
