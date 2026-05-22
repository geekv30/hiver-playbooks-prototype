'use client';
import { useCallback, useMemo } from 'react';
import { usePlaybook } from '@/hooks/usePlaybook';
import { usePicker } from '@/hooks/usePicker';
import { useCaretAnchor } from '@/hooks/useCaretAnchor';
import { useRail } from '@/hooks/useRail';
import { useToast } from '@/hooks/useToast';
import { useGlobalShortcut } from '@/hooks/useGlobalShortcut';
import { validate, type ValidationIssue } from '@/lib/validation';
import { newId } from '@/lib/ids';
import { findAction } from '@/data/library';
import type { Chip, Step, ConnectorSlug, ActionStep } from '@/types/playbook';
import EditorShell from '@/components/canvas/EditorShell';
import Topbar from '@/components/canvas/Topbar';
import LeftNav from '@/components/canvas/LeftNav';
import CanvasBody from '@/components/canvas/CanvasBody';
import RightRail from '@/components/canvas/RightRail';
import Jumplist from '@/components/canvas/Jumplist';
import Picker from '@/components/surfaces/Picker';
import { ToastStack } from '@/components/atoms/Toast';

function findChipInPlaybook(steps: Step[], chipId: string): Chip | null {
  for (const s of steps) {
    if (s.kind === 'action') {
      for (const f of s.fragments) if (f.kind === 'chip' && f.chip.id === chipId) return f.chip;
    } else if (s.kind === 'condition') {
      for (const f of s.exprFragments) if (f.kind === 'chip' && f.chip.id === chipId) return f.chip;
      for (const b of s.branches) {
        for (const f of b.exprFragments) if (f.kind === 'chip' && f.chip.id === chipId) return f.chip;
        for (const f of b.bodyFragments) if (f.kind === 'chip' && f.chip.id === chipId) return f.chip;
      }
    } else if (s.kind === 'approval') {
      for (const f of s.promptFragments) if (f.kind === 'chip' && f.chip.id === chipId) return f.chip;
    }
  }
  return null;
}

export default function Home() {
  const pb = usePlaybook();
  const picker = usePicker();
  const caret = useCaretAnchor();
  const rail = useRail();
  const toast = useToast();

  const issues = useMemo(() => validate(pb.playbook), [pb.playbook]);
  const blocking = issues.length > 0;

  const configChip = useMemo<Chip | null>(
    () => (rail.configChipId ? findChipInPlaybook(pb.playbook.steps, rail.configChipId) : null),
    [rail.configChipId, pb.playbook.steps],
  );

  // SLASH handler: open action picker at caret; on select, insert a new action step.
  const onSlash = useCallback((stepId: string, body: HTMLElement) => {
    const anchor = caret.computeAnchor(body);
    picker.open({
      scope: 'action',
      query: '',
      anchor,
      contextStepId: stepId,
      onSelect: (actionId) => {
        const action = findAction(actionId);
        if (!action) return;
        const chip: Chip = { id: newId('chip'), actionId, status: 'draft', config: {} };
        const step: ActionStep = {
          kind: 'action',
          id: newId('step'),
          fragments: [{ kind: 'chip', chip }],
        };
        pb.insertStep(stepId, step);
        picker.close();
        toast.push(`Inserted ${action.name}`);
      },
    });
  }, [caret, picker, pb, toast]);

  // @ handler: open ref picker at caret; on select, toast (insertion into contentEditable is not wired in v1).
  const onAt = useCallback((stepId: string, body: HTMLElement) => {
    const anchor = caret.computeAnchor(body);
    picker.open({
      scope: 'ref',
      query: '',
      anchor,
      contextStepId: stepId,
      onSelect: (refId) => {
        if (refId === '__create__') {
          toast.push('Custom ref creation coming soon', 'warn');
        } else {
          toast.push(`Selected ref ${refId}`);
        }
        picker.close();
      },
    });
  }, [caret, picker, toast]);

  // Cmd+K / Ctrl+K
  useGlobalShortcut(
    useCallback((e: KeyboardEvent) => e.key === 'k' && (e.metaKey || e.ctrlKey), []),
    useCallback((e: KeyboardEvent) => {
      e.preventDefault();
      picker.open({
        scope: 'global',
        query: '',
        anchor: null,
        contextStepId: null,
        onSelect: (id) => {
          toast.push(`Selected ${id}`);
          picker.close();
        },
      });
    }, [picker, toast]),
  );

  // Esc closes the picker globally too (in case the picker's internal handler missed)
  useGlobalShortcut(
    useCallback((e: KeyboardEvent) => e.key === 'Escape' && picker.isOpen, [picker.isOpen]),
    useCallback(() => picker.close(), [picker]),
  );

  const onChipClick = useCallback((_stepId: string, chipId: string) => {
    const chip = findChipInPlaybook(pb.playbook.steps, chipId);
    if (!chip) return;
    const action = findAction(chip.actionId);
    if (action?.connectorSlug) {
      const conn = pb.playbook.connectors.find((c) => c.slug === action.connectorSlug);
      if (conn && !conn.authed) {
        rail.openConfig(chipId);
        rail.openSetup(action.connectorSlug);
        return;
      }
    }
    rail.openConfig(chipId);
  }, [pb.playbook, rail]);

  const onResolveIssue = useCallback((issue: ValidationIssue) => {
    const targetId = issue.targetId;
    if (targetId) {
      const el = document.querySelector(`[data-step-id="${targetId}"]`)
              ?? document.querySelector(`[data-chip-id="${targetId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('target-pulse');
        window.setTimeout(() => el.classList.remove('target-pulse'), 2000);
      }
    } else {
      // Scroll frontmatter for name/summary issues
      const fm = document.querySelector('[data-step-id="__frontmatter__"]');
      fm?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleOverflow = useCallback(() => {
    if (window.confirm('Reset playbook to seeded Walk Japan state? This discards your edits.')) {
      pb.reset();
      toast.push('Playbook reset', 'success');
    }
  }, [pb, toast]);

  const handleInsertBetween = useCallback((afterId: string | null) => {
    // Find a step body element to anchor the picker on
    const targetSel = afterId
      ? `[data-step-id="${afterId}"]`
      : `[data-step-id="__frontmatter__"]`;
    const el = document.querySelector(targetSel) as HTMLElement | null;
    if (!el) return;
    const stepBody = (el.querySelector('[contenteditable]') as HTMLElement | null) ?? el;
    onSlash(afterId ?? pb.playbook.steps[0]?.id ?? '', stepBody);
  }, [onSlash, pb.playbook.steps]);

  return (
    <>
      <EditorShell
        topbar={
          <Topbar
            playbookName={pb.playbook.frontmatter.name}
            saveStatus={pb.saveStatus}
            lastSavedAt={pb.lastSavedAt}
            bindings={pb.playbook.bindings}
            onRenamePlaybook={(name) => pb.setFrontmatter({ name })}
            onTest={() => toast.push('Test workspace coming soon')}
            onActivate={() => blocking ? toast.push('Resolve validation issues first', 'warn') : toast.push('Activation modal coming soon')}
            onOverflow={handleOverflow}
            onBack={() => toast.push('Back navigation coming soon')}
            validationBlocking={blocking}
          />
        }
        nav={<LeftNav onItem={(i) => toast.push(`${i} coming soon`)} />}
        canvas={
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', minWidth: 0, height: 'calc(100vh - 56px)' }}>
            <Jumplist
              steps={pb.playbook.steps}
              onJump={(id) => {
                const sel = id === '__frontmatter__'
                  ? `[data-step-id="__frontmatter__"]`
                  : `[data-step-id="${id}"]`;
                document.querySelector(sel)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            />
            <CanvasBody
              playbook={pb.playbook}
              issues={issues}
              onFmChange={pb.setFrontmatter}
              onSlash={onSlash}
              onAt={onAt}
              onChipClick={onChipClick}
              onDeleteStep={pb.removeStep}
              onInsertBetween={handleInsertBetween}
              onAddBranch={pb.addBranch}
              onResolveIssue={onResolveIssue}
            />
          </div>
        }
        rail={
          <RightRail
            playbook={pb.playbook}
            tab={rail.tab}
            mode={rail.mode}
            configChip={configChip}
            setupSlug={rail.setupConnectorSlug as ConnectorSlug | null}
            onTabChange={rail.setTab}
            onSetConnectorAuth={(slug, authed, label) => {
              pb.setConnectorAuth(slug, authed, label);
              if (authed) toast.push(`${slug} connected`, 'success');
            }}
            onUpdateChip={pb.updateChip}
            onSetBindingActive={pb.setBindingActive}
            onOpenSetup={rail.openSetup}
            onCloseSetup={rail.closeSetup}
          />
        }
      />
      {picker.isOpen && picker.scope && (
        <Picker
          scope={picker.scope}
          query={picker.query}
          onQuery={picker.setQuery}
          anchor={picker.anchor}
          onSelect={(id) => picker.onSelect?.(id)}
          onClose={picker.close}
        />
      )}
      <ToastStack items={toast.items} />
    </>
  );
}
