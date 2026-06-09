'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { RiDraggable, RiMore2Fill } from 'react-icons/ri';
import type { Fragment } from '@/types/playbook';
import GutterMarker from '@/components/atoms/GutterMarker';
import RowMenu from './RowMenu';
import GmailBar from './GmailBar';
import Toolbar from './Toolbar';
import ChatBar from './ChatBar';
import CoachmarkTriggers from './CoachmarkTriggers';
import EditorLine, { PaletteRequest } from './EditorLine';
import CommandPalette from './CommandPalette';
import ConditionBlock from './condition/ConditionBlock';
import ColdStartModal from './ColdStartModal';
import ActionHint from './ActionHint';
import EnableModal from './enable/EnableModal';
import SimulatePanel from '@/components/simulate/SimulatePanel';
import { type CopilotMessage, type CopilotProposalData } from './copilot/CopilotPanel';
import SidePanel, { type SideTab } from './copilot/SidePanel';
import CopilotMorph from './copilot/CopilotMorph';
import type { Verdict } from '@/components/atoms/ThumbsRating';
import { REFERENCE_ID, actionBehavior } from './paletteCatalog';
import { useEditorDoc } from './useEditorDoc';
import {
  LineTarget,
  makeChip,
  makeRef,
  makePendingChip,
  PENDING_ACTION,
  txt,
  normalizeLine,
  lineIsEmpty,
  lineHasContent,
  stepHasContent,
  isCondition,
  type EditorDoc,
  type DocPatchOp,
} from './doc';
import styles from './EditorCanvas.module.css';

interface PaletteState {
  target: LineTarget;
  req: PaletteRequest;
  // When set, the palette is EDITING this placed chip (reopened on its value page),
  // so a pick commits back to it instead of inserting a new chip.
  edit?: { chipId: string; initialAction: string; initialPicked?: string[]; initialQuery?: string };
}

interface FocusReq {
  key: string;
  atStart: boolean;
  token: number;
}

const TRIGGER_PLACEHOLDER = 'e.g. when an email reports an API error';
// Step placeholder + the "@ for actions" hint pill on a fresh line (Figma 647:40010).
// '@' opens the actions command palette (references are reachable inside it); the
// hint pill is the no-keystroke path. Curly quotes around '@' per the Figma copy.
const STEP_PLACEHOLDER = 'Write what to do. Type ‘@’ for actions';

// The tag-owning mailboxes pre-selected when enabling. Shown ONLY when the AOP
// actually uses tags (see docUsesTags) so the banner never asserts a false claim
// on a tag-less AOP. Generic/config (reusability rule).
const PRE_ENABLED_MAILBOXES = ['support', 'sales'];

// Does the doc use any Tag action? (a chip with actionId 'tag', anywhere -
// trigger, steps, condition branches). Recursive scan, no structural assumptions.
function docUsesTags(doc: EditorDoc): boolean {
  let found = false;
  JSON.stringify(doc, (_k, v) => {
    if (v && typeof v === 'object' && (v as { actionId?: string }).actionId === 'tag') found = true;
    return v;
  });
  return found;
}

// Copilot cold-start handoff: the working steps shown while the AOP drafts,
// then a short generic acknowledgement (reusability rule: generic copy).
const COPILOT_THINK_STEPS = [
  'Thinking through your request',
  'Referencing recent emails',
  'Building your AOP',
];
// Follow-up reasoning steps shown (deliberately, not instantly) before a reply
// streams; afterwards they collapse into an expandable "Thought for Ns". Generic
// copy (reusability rule). The pace is a tuned, deliberate value (was too fast).
const FOLLOWUP_THINK_STEPS = ['Reading your AOP', 'Planning the change'];
const COPILOT_PER_STEP = 820; // ms per thinking step (deliberate, not instant)
const COPILOT_ACK =
  'Drafted a first version on the left - a trigger, the steps, and the reply. Tell me what to adjust and I will update it.';
// A few generic helpful replies (reusability rule: no case-specific content).
const COPILOT_REPLIES = [
  "Good question. I'd add a step that handles that case explicitly, then a fallback branch so nothing slips through - want me to draft that on the left?",
  'Here is how I would approach it: extract the key details, check the relevant connector, then branch on the outcome before drafting the reply. I can wire that up.',
  "Makes sense. To make this sturdier, add an ELSE branch for anything that doesn't match and an approval step before sending. Shall I add those?",
];

// --- Copilot proposals: generic, append-only changes the user can apply --------
// Built fresh per send (factories) so each inserted chip/step gets a unique id.
// Content is generic placeholder (same reusability class as COPILOT_REPLIES); the
// real edit happens through api.applyPatch only after the user clicks Apply.
const fallbackBranch = (): DocPatchOp => ({
  op: 'appendCondition',
  branches: [
    {
      type: 'if',
      condition: [txt('the email matches one of the cases above')],
      body: [txt('handle it as described above.')],
    },
    {
      type: 'else',
      body: [makeChip('draft_reply'), txt(' a holding response and escalate to a teammate.')],
    },
  ],
});
const approvalStep = (): DocPatchOp => ({
  op: 'appendStep',
  body: [txt('Hold the reply for a teammate to approve before it is sent.')],
});

interface CannedProposal {
  reply: string;
  data: CopilotProposalData;
}
const proposalFoolproof = (): CannedProposal => ({
  reply:
    "To make this sturdier I'd add an approval checkpoint before anything is sent, and a fallback branch so nothing slips through. Here is the change - apply it when you're ready:",
  data: {
    title: 'Make your AOP foolproof',
    summary: [
      'Add a fallback branch for anything unmatched',
      'Add an approval step before replies are sent',
    ],
    patch: [fallbackBranch(), approvalStep()],
  },
});
const proposalFallback = (): CannedProposal => ({
  reply:
    "Good call. I'll add an IF / ELSE fallback at the end so any email that doesn't match an earlier case still gets a safe, drafted response:",
  data: {
    title: 'Add a fallback branch',
    summary: ['Add an IF / ELSE branch that catches anything unmatched'],
    patch: [fallbackBranch()],
  },
});
const proposalApproval = (): CannedProposal => ({
  reply: "Sure - I'll add an approval step so a teammate signs off before any reply goes out:",
  data: {
    title: 'Add an approval step',
    summary: ['Add an approval step before replies are sent'],
    patch: [approvalStep()],
  },
});
// Loose intent match on the user's message -> a concrete, applyable proposal.
function matchProposal(text: string): CannedProposal | null {
  const t = text.toLowerCase();
  if (/foolproof|bulletproof|sturd|robust|safer|harden/.test(t)) return proposalFoolproof();
  // NB: match "fallback" / "catch-all" etc., but NOT a bare "else" - that fires on
  // common phrases like "what else can I do" (so we require "else branch/case").
  if (/fallback|catch[- ]?all|unmatched|edge case|else branch|else case/.test(t))
    return proposalFallback();
  if (/approv|sign[- ]?off|review before|double[- ]?check/.test(t)) return proposalApproval();
  return null;
}

// Update the most recent assistant message in place (cold-start steps + streaming).
function updateLastAssistant(
  msgs: CopilotMessage[],
  fn: (m: CopilotMessage) => CopilotMessage,
): CopilotMessage[] {
  const out = [...msgs];
  for (let i = out.length - 1; i >= 0; i -= 1) {
    if (out[i]!.role === 'assistant') {
      out[i] = fn(out[i]!);
      break;
    }
  }
  return out;
}

interface Props {
  /** Optional starting document. Omit for a fresh empty AOP (/canvas);
   *  /api-example passes the seeded example. */
  initialDoc?: EditorDoc;
  /** Mount the Copilot + Evaluate companions: the floating tool-switcher rail and
   *  the two mutually-exclusive right-hand panels (docked workspace). /canvas sets
   *  this; /api-example (the bare worked example) does not. */
  companions?: boolean;
}

// Cold-start presentation phase for the one Copilot surface:
//   'hero'     = the "draft with AI" modal is open, the dock is not rendered
//   'morphing' = the modal is animating into the dock (task 3); dock mounted but hidden
//   'docked'   = the modal is gone, the dock is the visible Copilot
type ColdStartPhase = 'hero' | 'morphing' | 'docked';

export default function EditorCanvas({ initialDoc, companions }: Props) {
  const api = useEditorDoc(initialDoc);
  const { doc, undo, redo } = api;
  // Always-current doc (for handlers that need the freshest doc, e.g. snapshotting
  // before a proposal Apply so its Undo restores exactly the pre-apply state).
  const docRef = useRef(doc);
  docRef.current = doc;
  // Pre-Apply doc snapshots, keyed by the proposal message index, so a proposal
  // card's Undo reverts to exactly its pre-apply state (never an unrelated commit).
  const applySnapshots = useRef<Record<number, EditorDoc>>({});

  const [palette, setPalette] = useState<PaletteState | null>(null);
  // The "@ action" placeholder chip currently being configured in the palette
  // (Figma 647:41076). It's inserted on '@', updated in realtime as the user
  // picks/configures, and finalized (or removed) when the palette closes.
  const [pendingChip, setPendingChip] = useState<{ target: LineTarget; chipId: string } | null>(
    null,
  );
  const [focusReq, setFocusReq] = useState<FocusReq | null>(null);
  // The step whose caret is active. The "@ for actions" pill anchors to this line
  // and stays put while the user types; we only update it when a step gains focus
  // (we do NOT reset it from the trigger / condition lines), so the pill stays
  // "fixed" until the caret enters another step. null = no step focused yet
  // (initial load) -> the pill rests under the last step.
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  // Step reorder (drag the row handle) + the row 3-dot menu (Figma 647:40811).
  // `drag` = the step being dragged; `dropIdx` = the gap it would drop into (0..N);
  // `menuStepId` = the step whose kebab menu is open. The row chrome (handle +
  // kebab) reveals on row-hover; each icon grays only on its own hover (CSS).
  const [drag, setDrag] = useState<{ id: string } | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);
  const [menuStepId, setMenuStepId] = useState<string | null>(null);
  const stepsListRef = useRef<HTMLOListElement>(null);
  // Row midpoints captured at drag start, in viewport coords (same space as the
  // pointer's clientY - both live inside the 0.9 zoom, so no scaling math needed).
  const dragMidsRef = useRef<{ id: string; mid: number }[]>([]);
  // The drag id + drop index are mirrored in refs so the pointermove/up handlers
  // read the LIVE value (not a stale render closure) - a fast drag fires moves
  // before React re-renders, and without this the first move (or the commit on
  // release) would be dropped.
  const dragRef = useRef<string | null>(null);
  const dropIdxRef = useRef<number | null>(null);
  // The floating Simulate panel - only on the non-companion routes (the toolbar
  // Simulate toggle). On /canvas the docked SidePanel owns Simulate as a tab.
  const [simOpen, setSimOpen] = useState(false);
  // The docked SidePanel's active tab (companions): Copilot or Simulate.
  const [panelTab, setPanelTab] = useState<SideTab>('copilot');
  // The Enable / settings modal: 'commit' = the go-live flow (Enable button) ->
  // success moment; 'manage' = edit a live AOP's name + mailboxes (the gear). Name
  // + mailbox edits are held LOCALLY and committed to the doc only on confirm, so
  // editing a live AOP and cancelling never mutates it.
  const [enableMode, setEnableMode] = useState<null | 'commit' | 'manage'>(null);
  const [enableName, setEnableName] = useState('');
  const [enableMailboxes, setEnableMailboxes] = useState<string[]>([]);
  // The cold-start "draft with AI" modal shows on a fresh, empty canvas (no
  // initialDoc); the pre-seeded /api-example demo skips it. See ColdStartPhase above.
  const [coldPhase, setColdPhase] = useState<ColdStartPhase>(initialDoc ? 'docked' : 'hero');
  const coldStartOpen = coldPhase === 'hero'; // single remaining read: the ColdStartModal gate below
  // Morph scaffolding: capture the modal surface rect at exit (morphSrcRect) and
  // wrap the dock in dockRef so its target rect is measurable during 'morphing'.
  // morphRects holds the from/to pair once both rects are known (task 3 uses it).
  const morphSrcRect = useRef<DOMRect | null>(null);
  const dockRef = useRef<HTMLDivElement | null>(null);
  // morphRects + setMorphRects used in task 3 to drive the FLIP morph layer
  const [morphRects, setMorphRects] = useState<{ from: DOMRect; to: DOMRect } | null>(null);
  // Copilot conversation (owned here so the cold-start query can seed it). thinkIdx
  // drives the working animation (-1 = idle); pendingDoc holds the drafted doc
  // until the animation finishes, then it loads onto the canvas.
  const [copilotMessages, setCopilotMessages] = useState<CopilotMessage[]>([]);
  // Mirror the messages in a ref so interaction handlers (apply/undo/regenerate)
  // can read the freshest message without re-subscribing.
  const copilotMessagesRef = useRef(copilotMessages);
  copilotMessagesRef.current = copilotMessages;
  const [thinkIdx, setThinkIdx] = useState(-1);
  const pendingDoc = useRef<EditorDoc | null>(null);
  const streamTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  // The brief "thinking" delay before a reply streams (separate from streamTimer
  // so Stop can cancel it during that window too).
  const thinkDelayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const replyCount = useRef(0);
  const [hint, setHint] = useState<{
    msg: string;
    action?: { label: string; run: () => void };
  } | null>(null);
  const tokenRef = useRef(0);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lineKey = (t: LineTarget) =>
    t.kind === 'trigger'
      ? 'trigger'
      : t.kind === 'cond'
        ? `cond:${t.condId}:${t.branchId}:${t.part}:${t.part === 'body' ? (t.lineId ?? '') : ''}`
        : `step:${t.id}`;

  // Ask a line to take the caret. The matching line focuses itself (mount or
  // update), so this works even for a step that was just created.
  const requestFocus = useCallback((key: string, atStart: boolean) => {
    tokenRef.current += 1;
    setFocusReq({ key, atStart, token: tokenRef.current });
  }, []);

  // Ephemeral "coming soon" toast for chrome actions not wired in this prototype
  // (Activate / Back / Docs) so a click registers as intentional, not a no-op.
  const showHint = useCallback((msg: string, action?: { label: string; run: () => void }) => {
    setHint({ msg, action });
    if (hintTimer.current) clearTimeout(hintTimer.current);
    // Give an actionable toast (Undo) longer to live.
    hintTimer.current = setTimeout(() => setHint(null), action ? 5200 : 2600);
  }, []);

  // --- Enable / pause / resume / settings ------------------------------------
  // Open the modal, seeding its LOCAL draft from the doc (pre-selecting the
  // tag-owning mailboxes on a fresh AOP). Commit applies the draft to the doc.
  const openEnable = useCallback(
    (mode: 'commit' | 'manage') => {
      setEnableName(doc.title);
      const pre = docUsesTags(doc) ? PRE_ENABLED_MAILBOXES : [];
      setEnableMailboxes(doc.mailboxes.length ? doc.mailboxes : pre);
      setEnableMode(mode);
    },
    [doc],
  );
  const confirmEnable = useCallback(() => {
    api.setTitle(enableName.trim() || 'Untitled AOP');
    api.setMailboxes(enableMailboxes);
    if (enableMode === 'commit') {
      api.enable(); // the modal's success moment already played; this flips status
    } else {
      showHint('Changes saved.');
    }
    setEnableMode(null);
  }, [api, enableName, enableMailboxes, enableMode, showHint]);
  const pauseAop = useCallback(() => {
    api.pause();
    showHint(`${doc.title || 'This AOP'} paused.`, { label: 'Undo', run: () => api.enable() });
  }, [api, doc.title, showHint]);
  const resumeAop = useCallback(() => {
    api.enable();
    showHint(`${doc.title || 'This AOP'} is live again.`);
  }, [api, doc.title, showHint]);

  const focusFor = (key: string): { token: number; atStart: boolean } | null =>
    focusReq && focusReq.key === key ? { token: focusReq.token, atStart: focusReq.atStart } : null;

  // Cold-start -> Copilot continuity. Generate seeds the query as the user's first
  // Copilot message, opens Copilot, and runs a short "working" animation; when it
  // finishes the drafted AOP loads on the left and Copilot posts an ack, so
  // any follow-up continues in the Copilot thread. Skip lands on a blank canvas.
  const handleColdStartGenerate = useCallback((genDoc: EditorDoc, query: string) => {
    setColdPhase('docked');
    setPanelTab('copilot');
    setCopilotMessages([
      { role: 'user', text: query },
      { role: 'assistant', text: '', thinking: true, steps: COPILOT_THINK_STEPS, stepIdx: 0 },
    ]);
    pendingDoc.current = genDoc;
    setThinkIdx(0);
  }, []);
  const handleColdStartDismiss = useCallback(() => {
    setColdPhase('docked');
    requestFocus('trigger', false);
  }, [requestFocus]);
  // Capture the modal's surface rect as it leaves, so the morph can fly from it.
  const handleBeforeExit = useCallback((r: DOMRect) => {
    morphSrcRect.current = r;
  }, []);

  // On entering 'morphing': measure the (now hidden but laid-out) dock surface as
  // the FLIP target and pair it with the captured modal source. The dock <aside>
  // is the firstElementChild because .dockSlot is display:contents. If either
  // rect is missing/zero, skip the morph cleanly straight to 'docked'.
  useLayoutEffect(() => {
    if (coldPhase !== 'morphing') return;
    const to = dockRef.current?.firstElementChild?.getBoundingClientRect();
    const from = morphSrcRect.current;
    if (from && to && to.width > 0 && to.height > 0) {
      setMorphRects({ from, to });
    } else {
      setColdPhase('docked');
    }
  }, [coldPhase]);

  // Drive the cold-start working steps on the seeded assistant message, then load
  // the drafted doc + resolve that message to the acknowledgement.
  useEffect(() => {
    if (thinkIdx < 0) return;
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const per = reduce ? 300 : 850; // cold-start pace (deliberate first-draft beat)
    if (thinkIdx < COPILOT_THINK_STEPS.length) {
      setCopilotMessages((prev) =>
        updateLastAssistant(prev, (m) => ({ ...m, stepIdx: thinkIdx, thinking: true })),
      );
      const t = setTimeout(() => setThinkIdx((i) => i + 1), per);
      return () => clearTimeout(t);
    }
    if (pendingDoc.current) {
      api.loadDoc(pendingDoc.current);
      pendingDoc.current = null;
    }
    // Collapse the working steps into a stored thought above the acknowledgement.
    setCopilotMessages((prev) =>
      updateLastAssistant(prev, (m) => ({
        ...m,
        role: 'assistant',
        text: COPILOT_ACK,
        thinking: false,
        thought: { ms: COPILOT_THINK_STEPS.length * per },
        steps: COPILOT_THINK_STEPS,
      })),
    );
    setThinkIdx(-1);
    requestFocus('trigger', false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thinkIdx]);

  // Stream a reply into the latest assistant message (used by send + regenerate):
  // a brief think, then word-by-word. An optional proposal is attached on the
  // FINAL frame so it appears once the reply finishes. Reduced-motion drops the
  // full text at once.
  const streamReply = useCallback(
    (reply: string, proposal?: CopilotProposalData, steps: string[] = FOLLOWUP_THINK_STEPS) => {
      if (streamTimer.current) {
        clearInterval(streamTimer.current);
        streamTimer.current = null;
      }
      if (thinkDelayTimer.current) {
        clearTimeout(thinkDelayTimer.current);
        thinkDelayTimer.current = null;
      }
      const thoughtMs = steps.length * COPILOT_PER_STEP;
      const reduce =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (reduce) {
        setCopilotMessages((prev) =>
          updateLastAssistant(prev, (m) => ({
            ...m,
            role: 'assistant',
            text: reply,
            thinking: false,
            streaming: false,
            thought: { ms: thoughtMs },
            steps,
            ...(proposal ? { proposal } : {}),
          })),
        );
        return;
      }
      // Thinking phase: walk the working steps at a deliberate pace, then collapse
      // them into a stored thought and stream the reply word-by-word.
      setCopilotMessages((prev) =>
        updateLastAssistant(prev, (m) => ({
          ...m,
          role: 'assistant',
          text: '',
          thinking: true,
          steps,
          stepIdx: 0,
        })),
      );
      let si = 0;
      const advance = () => {
        si += 1;
        if (si < steps.length) {
          setCopilotMessages((prev) => updateLastAssistant(prev, (m) => ({ ...m, stepIdx: si })));
          thinkDelayTimer.current = setTimeout(advance, COPILOT_PER_STEP);
          return;
        }
        thinkDelayTimer.current = null;
        const words = reply.split(' ');
        let i = 0;
        setCopilotMessages((prev) =>
          updateLastAssistant(prev, (m) => ({
            ...m,
            role: 'assistant',
            text: '',
            thinking: false,
            streaming: true,
            thought: { ms: thoughtMs },
            steps,
          })),
        );
        streamTimer.current = setInterval(() => {
          i += 1;
          const shown = words.slice(0, i).join(' ');
          const done = i >= words.length;
          setCopilotMessages((prev) =>
            updateLastAssistant(prev, (m) => ({
              ...m,
              role: 'assistant',
              text: shown,
              streaming: !done,
              ...(done && proposal ? { proposal } : {}),
            })),
          );
          if (done && streamTimer.current) {
            clearInterval(streamTimer.current);
            streamTimer.current = null;
          }
        }, 30);
      };
      thinkDelayTimer.current = setTimeout(advance, COPILOT_PER_STEP);
    },
    [],
  );

  // Follow-up sends: append the user message + a streamed assistant reply. If the
  // message reads as a hardening request, the reply carries a concrete, applyable
  // proposal (matched generically); otherwise a generic helpful reply.
  const sendCopilot = useCallback(
    (text: string) => {
      const matched = matchProposal(text);
      let reply: string;
      if (matched) {
        reply = matched.reply;
      } else {
        reply = COPILOT_REPLIES[replyCount.current % COPILOT_REPLIES.length]!;
        replyCount.current += 1;
      }
      setCopilotMessages((prev) => [
        ...prev,
        { role: 'user', text },
        { role: 'assistant', text: '' },
      ]);
      streamReply(reply, matched?.data);
    },
    [streamReply],
  );

  // Regenerate: re-stream the last assistant reply with a fresh take. Preserve the
  // message via ...m (NOT a bare replace) so its proposal AND proposalState ride
  // along - an already-applied/dismissed card stays settled and can't be re-applied.
  const regenerateCopilot = useCallback(() => {
    const reply = COPILOT_REPLIES[replyCount.current % COPILOT_REPLIES.length]!;
    replyCount.current += 1;
    setCopilotMessages((prev) =>
      updateLastAssistant(prev, (m) => ({ ...m, role: 'assistant', text: '' })),
    );
    streamReply(reply);
  }, [streamReply]);

  // Stop: interrupt an in-flight reply (cancel the stream / think delay, freeze
  // any partial text) or abort the cold-start build (drop the pending draft).
  const stopCopilot = useCallback(() => {
    if (streamTimer.current) {
      clearInterval(streamTimer.current);
      streamTimer.current = null;
    }
    if (thinkDelayTimer.current) {
      clearTimeout(thinkDelayTimer.current);
      thinkDelayTimer.current = null;
    }
    if (thinkIdx >= 0) {
      pendingDoc.current = null;
      setThinkIdx(-1);
    }
    setCopilotMessages((prev) =>
      updateLastAssistant(prev, (m) => ({
        ...m,
        role: 'assistant',
        text: m.text && m.text.length > 0 ? m.text : 'Stopped.',
        thinking: false,
        streaming: false,
      })),
    );
  }, [thinkIdx]);

  // New chat: cancel any in-flight reply/build and wipe the thread.
  const clearCopilot = useCallback(() => {
    if (streamTimer.current) {
      clearInterval(streamTimer.current);
      streamTimer.current = null;
    }
    if (thinkDelayTimer.current) {
      clearTimeout(thinkDelayTimer.current);
      thinkDelayTimer.current = null;
    }
    pendingDoc.current = null;
    replyCount.current = 0;
    setThinkIdx(-1);
    setCopilotMessages([]);
  }, []);

  // Proposal card actions. The doc only changes on Apply (consent-gated); applied
  // patches commit as one undo entry, so Undo reverts the whole change + re-opens
  // the card.
  const applyProposal = useCallback(
    (index: number) => {
      const m = copilotMessagesRef.current[index];
      // Guard against a double-apply (re-applied via regenerate or a rapid 2nd click)
      // - applyDocPatch mints fresh ids, so re-applying genuinely duplicates inserts.
      if (!m?.proposal || m.proposalState === 'applied') return;
      // Snapshot the exact pre-apply doc so this card's Undo restores it deterministically.
      applySnapshots.current[index] = docRef.current;
      api.applyPatch(m.proposal.patch);
      setCopilotMessages((prev) =>
        prev.map((mm, i) => (i === index ? { ...mm, proposalState: 'applied' } : mm)),
      );
    },
    [api],
  );
  const dismissProposal = useCallback((index: number) => {
    setCopilotMessages((prev) =>
      prev.map((m, i) => (i === index ? { ...m, proposalState: 'dismissed' } : m)),
    );
  }, []);
  const undoProposal = useCallback(
    (index: number) => {
      // Restore the exact pre-apply doc (not a bare api.undo(), which would revert
      // whatever the latest commit happened to be - possibly unrelated work).
      const snap = applySnapshots.current[index];
      if (snap) {
        api.loadDoc(snap);
        delete applySnapshots.current[index];
      } else {
        api.undo();
      }
      setCopilotMessages((prev) =>
        prev.map((m, i) => (i === index ? { ...m, proposalState: 'open' } : m)),
      );
    },
    [api],
  );
  const setCopilotVerdict = useCallback((index: number, v: Verdict) => {
    setCopilotMessages((prev) => prev.map((m, i) => (i === index ? { ...m, verdict: v } : m)));
  }, []);

  // Clean up any in-flight timers on unmount.
  useEffect(
    () => () => {
      if (streamTimer.current) clearInterval(streamTimer.current);
      if (thinkDelayTimer.current) clearTimeout(thinkDelayTimer.current);
    },
    [],
  );

  // Undo / redo via the keyboard (the toolbar buttons were removed): Cmd/Ctrl+Z
  // undo, Cmd/Ctrl+Shift+Z (or Ctrl+Y) redo. We skip when focus is in a plain
  // <input>/<textarea> (the Copilot composer, the cold-start field) so native
  // text undo still works there; the editor's own contenteditable lines route to
  // doc-level undo (the doc history is the source of truth). undo()/redo() no-op
  // when there is nothing to undo/redo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      const k = e.key.toLowerCase();
      if (k === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (k === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  const lineFrags = (t: LineTarget): Fragment[] => {
    if (t.kind === 'trigger') return doc.trigger;
    if (t.kind === 'cond') {
      const step = doc.steps.find((s) => s.id === t.condId);
      if (!step || !isCondition(step)) return [];
      const b = step.branches.find((br) => br.id === t.branchId);
      if (!b) return [];
      if (t.part === 'expr') return b.condition ?? [];
      const lid = t.lineId ?? b.lines[0]?.id;
      return b.lines.find((ln) => ln.id === lid)?.body ?? [];
    }
    const step = doc.steps.find((s) => s.id === t.id);
    return step && !isCondition(step) ? step.body : [];
  };

  const handleChange = (t: LineTarget) => (frags: Fragment[]) => {
    api.setLine(t, frags, `text:${lineKey(t)}`);
  };

  const handleEnter = (t: LineTarget) => () => {
    if (t.kind === 'trigger') {
      // From the trigger, Enter drops into the first step.
      const first = doc.steps[0];
      if (first) requestFocus(`step:${first.id}`, true);
      return;
    }
    if (t.kind === 'cond') return; // lines inside a condition block don't add steps on Enter
    const newId = api.addStepAfter(t.id);
    requestFocus(`step:${newId}`, true);
  };

  const handleBackspaceEmpty = (t: LineTarget) => () => {
    if (t.kind !== 'step') return;
    const prevId = api.deleteStep(t.id);
    if (prevId) requestFocus(`step:${prevId}`, false);
  };

  // --- Step reorder (drag handle) + the row 3-dot menu (Figma 647:40811) -----
  // Pointer-drag from the handle: capture the row midpoints once, then the gap the
  // pointer is over becomes the drop index; release commits the move (one undo).
  const startDrag = (id: string) => (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      /* no active pointer (e.g. synthetic events) - capture is best-effort */
    }
    const ol = stepsListRef.current;
    if (!ol) return;
    dragMidsRef.current = [...ol.querySelectorAll<HTMLElement>('[data-step-row]')].map((li) => {
      const r = li.getBoundingClientRect();
      return { id: li.dataset.stepId ?? '', mid: (r.top + r.bottom) / 2 };
    });
    const startIdx = dragMidsRef.current.findIndex((m) => m.id === id);
    dragRef.current = id;
    dropIdxRef.current = startIdx;
    setMenuStepId(null);
    setDrag({ id });
    setDropIdx(startIdx);
  };
  const onDragMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current) return;
    let idx = dragMidsRef.current.findIndex((m) => e.clientY < m.mid);
    if (idx === -1) idx = dragMidsRef.current.length;
    dropIdxRef.current = idx;
    setDropIdx(idx);
  };
  const endDrag = () => {
    const id = dragRef.current;
    const idx = dropIdxRef.current;
    if (id && idx != null) api.moveStep(id, idx);
    dragRef.current = null;
    dropIdxRef.current = null;
    setDrag(null);
    setDropIdx(null);
  };

  // Close the row menu on Esc or an outside click (the kebab toggles it; clicks on
  // the menu or the kebab itself are not "outside").
  useEffect(() => {
    if (!menuStepId) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('[data-row-menu]') || t.closest('[data-kebab]')) return;
      setMenuStepId(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuStepId(null);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuStepId]);

  // Row chrome, revealed on row-hover via CSS. Both the drag handle and the kebab
  // slot are absolutely positioned, mirrored at -28px outside the row's left/right
  // edges, so they never consume a grid column (the number stays put, the content
  // does not shift) and the two affordances are symmetric from the card edges.
  const renderDragHandle = (stepId: string, i: number) => (
    <button
      type="button"
      className={styles.dragHandle}
      aria-label={`Reorder step ${i + 1}`}
      title="Drag to reorder"
      onPointerDown={startDrag(stepId)}
      onPointerMove={onDragMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <RiDraggable aria-hidden />
    </button>
  );
  const renderRowMenu = (stepId: string, i: number) => (
    <div className={styles.rowMenuSlot}>
      <button
        type="button"
        className={styles.kebab}
        aria-label={`Step ${i + 1} options`}
        aria-haspopup="menu"
        aria-expanded={menuStepId === stepId}
        data-kebab
        onClick={() => setMenuStepId((m) => (m === stepId ? null : stepId))}
      >
        <RiMore2Fill aria-hidden />
      </button>
      {menuStepId === stepId && (
        <RowMenu
          canMoveUp={i > 0}
          canMoveDown={i < doc.steps.length - 1}
          onMoveUp={() => {
            api.moveStepBy(stepId, -1);
            setMenuStepId(null);
          }}
          onMoveDown={() => {
            api.moveStepBy(stepId, 1);
            setMenuStepId(null);
          }}
          onDuplicate={() => {
            api.duplicateStep(stepId);
            setMenuStepId(null);
          }}
          onDelete={() => {
            api.deleteStep(stepId);
            setMenuStepId(null);
          }}
        />
      )}
    </div>
  );

  // Insert the dashed "@ action" placeholder chip at the caret and return its id
  // (the gap before/after a chip is owned by CSS margin - no space characters).
  const insertPendingChip = (
    target: LineTarget,
    fragIndex: number,
    caretOffset: number,
  ): string => {
    const pending = makePendingChip();
    const chipId = pending.kind === 'chip' ? pending.chip.id : '';
    const frags = lineFrags(target);
    const out: Fragment[] = [];
    frags.forEach((f, i) => {
      if (i === fragIndex && f.kind === 'text') {
        out.push(txt(f.text.slice(0, caretOffset)), pending, txt(f.text.slice(caretOffset)));
      } else {
        out.push(f);
      }
    });
    api.setLine(target, normalizeLine(out), `pending:${chipId}`);
    return chipId;
  };

  // Open the palette anchored to the just-inserted placeholder chip (deferred one
  // frame so the chip is in the DOM), so the popover hugs the dashed "@ action"
  // tag instead of the pre-insert caret position (which drifts after a reflow).
  const anchorPaletteToChip = (target: LineTarget, req: PaletteRequest, chipId: string) => {
    requestAnimationFrame(() => {
      const el =
        typeof document !== 'undefined'
          ? document.querySelector(`[data-chip-id="${chipId}"]`)
          : null;
      const rect = el
        ? ((r) => ({ left: r.left, top: r.top, bottom: r.bottom }))(el.getBoundingClientRect())
        : req.rect;
      setPalette({ target, req: { ...req, rect } });
    });
  };

  // '@' (or '/'): drop the placeholder chip at the caret + open the palette
  // anchored to it. The palette then configures THIS chip in realtime.
  const openPalette = (target: LineTarget) => (req: PaletteRequest) => {
    const chipId = insertPendingChip(target, req.fragIndex, req.caretOffset);
    setPendingChip({ target, chipId });
    anchorPaletteToChip(target, req, chipId);
  };

  // The "@ for actions" pill (no keystroke). Same model: insert a placeholder at
  // the line end + open the Actions palette anchored to the placeholder chip.
  const openActionsFromPlus = (target: LineTarget, el: HTMLElement) => {
    const frags = lineFrags(target);
    const idx = Math.max(0, frags.length - 1);
    const last = frags[idx];
    const caretOffset = last && last.kind === 'text' ? last.text.length : 0;
    const chipId = insertPendingChip(target, idx, caretOffset);
    setPendingChip({ target, chipId });
    const r = el.getBoundingClientRect();
    anchorPaletteToChip(
      target,
      {
        scope: 'actions',
        fragIndex: idx,
        caretOffset,
        rect: { left: r.left, top: r.top, bottom: r.bottom },
      },
      chipId,
    );
  };

  // Realtime: as the user picks/configures in the palette, update the pending
  // chip in place. actionId null -> back to the "@ action" placeholder; otherwise
  // the chip shows the chosen action + (live) configured value. All updates +
  // the insert + the finalize coalesce into ONE undo entry.
  const previewChip = (actionId: string | null, meta?: string) => {
    if (!pendingChip) return;
    const { target, chipId } = pendingChip;
    const out = lineFrags(target).map((f) =>
      f.kind === 'chip' && f.chip.id === chipId
        ? {
            kind: 'chip' as const,
            chip: { ...f.chip, actionId: actionId ?? PENDING_ACTION, config: meta ? { meta } : {} },
          }
        : f,
    );
    api.setLine(target, out, `pending:${chipId}`);
  };

  // Palette closed without committing: drop the placeholder if it never became a
  // real action; otherwise keep whatever was configured ("save & close").
  const closePalette = () => {
    if (pendingChip) {
      const { target, chipId } = pendingChip;
      const frags = lineFrags(target);
      const stillPending = frags.some(
        (f) => f.kind === 'chip' && f.chip.id === chipId && f.chip.actionId === PENDING_ACTION,
      );
      if (stillPending) {
        api.setLine(
          target,
          normalizeLine(frags.filter((f) => !(f.kind === 'chip' && f.chip.id === chipId))),
          `pending:${chipId}`,
        );
      }
      setPendingChip(null);
    }
    setPalette(null);
  };

  // --- Click a placed action tag to reconfigure it -> reopen the SAME command
  // palette on that action's value page (current value(s) pre-selected); the pick
  // commits back to this chip. No new UI - the palette is reused exactly as-is.
  const editCommit = (chipId: string, actionId: string, meta?: string) => {
    if (!palette) return;
    const { target } = palette;
    // 'Condition' is a block, not a chip - ignore if the user drilled back and picked it.
    if (actionId === 'condition') {
      setPalette(null);
      return;
    }
    let changed = false;
    const out = lineFrags(target).map((f) => {
      if (f.kind !== 'chip' || f.chip.id !== chipId) return f;
      // A re-picked reference becomes a @ref token; a different action becomes that
      // action chip; the SAME action just updates its value (preserving the id).
      if (actionId === REFERENCE_ID) {
        changed = true;
        return makeRef(meta ?? '');
      }
      if (actionId !== f.chip.actionId) {
        changed = true;
        return makeChip(actionId, meta);
      }
      const cur = typeof f.chip.config.meta === 'string' ? f.chip.config.meta : undefined;
      if (meta === undefined || meta === cur) return f; // no real change -> no commit
      changed = true;
      return { kind: 'chip' as const, chip: { ...f.chip, config: { ...f.chip.config, meta } } };
    });
    if (changed) api.setLine(target, normalizeLine(out));
    setPalette(null);
    requestFocus(lineKey(target), false);
  };

  // Open the palette already drilled into the clicked chip's value page, with its
  // current value(s) pre-selected. Only actions with a palette value page are
  // editable this way (EditorLine gates the click); mode 'insert' actions are not.
  const openChipEdit = (target: LineTarget) => (chipId: string, el: HTMLElement) => {
    const frag = lineFrags(target).find((f) => f.kind === 'chip' && f.chip.id === chipId);
    const chip = frag && frag.kind === 'chip' ? frag.chip : null;
    if (!chip) return;
    const behavior = actionBehavior(chip.actionId);
    if (behavior.mode === 'insert') return;
    setMenuStepId(null);
    const meta = typeof chip.config.meta === 'string' ? chip.config.meta : '';
    let initialPicked: string[] | undefined;
    let initialQuery: string | undefined;
    if (behavior.mode === 'pick-many') {
      const labels = meta.split(', ').map((s) => s.trim()).filter(Boolean);
      initialPicked = behavior.options.filter((o) => labels.includes(o.label)).map((o) => o.id);
    } else if (behavior.mode === 'input') {
      initialQuery = meta.replace(/^"([\s\S]*)"$/, '$1'); // open on the raw query
    }
    const r = el.getBoundingClientRect();
    setPalette({
      target,
      req: {
        scope: 'actions',
        fragIndex: 0,
        caretOffset: 0,
        rect: { left: r.left, top: r.top, bottom: r.bottom },
      },
      edit: { chipId, initialAction: chip.actionId, initialPicked, initialQuery },
    });
  };

  const insertChip = (actionId: string, meta?: string) => {
    if (!palette) return;
    const { target } = palette;
    // Editing a placed chip: commit the pick back to it (not a new insert).
    if (palette.edit) {
      editCommit(palette.edit.chipId, actionId, meta);
      return;
    }
    const pid = pendingChip?.chipId ?? null;
    // "Condition" is a block, not an inline chip. Drop the pending "@ action"
    // placeholder first, then decide from the CLEANED line (not the snapshot that
    // still holds the placeholder): if nothing else is on the line, swap the whole
    // step for a condition; otherwise keep the line's content and insert the
    // condition after it. (Computing emptiness from the snapshot left the
    // placeholder stranded on the line - the bug Varun caught.)
    if (actionId === 'condition') {
      setPendingChip(null);
      setPalette(null);
      if (target.kind === 'step') {
        // Strip ANY pending "@ action" placeholder by its marker (not the ref id,
        // which can already be cleared depending on how the palette was opened). If
        // the line is then empty, swap the whole step for a condition; otherwise
        // keep the line's content and insert the condition after it. The eager
        // docRef in commit lets these two commits chain without clobbering.
        const cleaned = normalizeLine(
          lineFrags(target).filter(
            (f) => !(f.kind === 'chip' && f.chip.actionId === PENDING_ACTION),
          ),
        );
        if (lineIsEmpty(cleaned)) {
          api.replaceWithCondition(target.id);
        } else {
          api.setLine(target, cleaned, pid ? `pending:${pid}` : 'cond-clean');
          api.insertConditionAfter(target.id);
        }
      } else if (target.kind === 'cond') {
        api.insertConditionAfter(target.condId);
      } else {
        api.insertConditionAfter();
      }
      return;
    }
    // Finalize the pending chip in place: 'reference' becomes an @-ref token,
    // everything else a real action chip (with the picked value as its meta).
    const finalFrag: Fragment =
      actionId === REFERENCE_ID ? makeRef(meta ?? '') : makeChip(actionId, meta);
    const out = pid
      ? lineFrags(target).map((f) => (f.kind === 'chip' && f.chip.id === pid ? finalFrag : f))
      : (() => {
          const { req } = palette;
          const acc: Fragment[] = [];
          lineFrags(target).forEach((f, i) => {
            if (i === req.fragIndex && f.kind === 'text') {
              acc.push(
                txt(f.text.slice(0, req.caretOffset)),
                finalFrag,
                txt(f.text.slice(req.caretOffset)),
              );
            } else acc.push(f);
          });
          return acc;
        })();
    api.setLine(target, normalizeLine(out), pid ? `pending:${pid}` : undefined);
    setPendingChip(null);
    requestFocus(lineKey(target), false);
    setPalette(null);
  };

  // The floating Simulate panel (non-companion routes; the toolbar toggle).
  const toggleSimulate = () => setSimOpen((o) => !o);

  // Which single step shows the "@ for actions" pill. It anchors to the step line
  // the caret is in and STAYS there as the user types (it does not vanish when the
  // line gains content); it moves only when the caret enters a different step line.
  // When no step has been focused (initial load) or the caret is elsewhere (the
  // trigger / a condition line), it rests under the last step - the natural place
  // to add the next action. Never more than one.
  const stepIds = doc.steps.filter((s) => !isCondition(s)).map((s) => s.id);
  const bubbleStepId =
    activeStepId && stepIds.includes(activeStepId)
      ? activeStepId
      : (stepIds[stepIds.length - 1] ?? null);

  return (
    <div className={styles.canvas}>
      <GmailBar />
      <Toolbar
        title={doc.title}
        onTitleChange={api.setTitle}
        status={doc.status}
        onSimulate={toggleSimulate}
        simulating={simOpen}
        hideSimulate={companions}
        // Enable is muted+disabled until the AOP has a trigger AND a step
        // (Figma 647:39849); then it routes THROUGH the guardrails commit panel.
        canEnable={lineHasContent(doc.trigger) && doc.steps.some((s) => stepHasContent(s))}
        onEnable={() => openEnable('commit')}
        onSettings={() => openEnable('manage')}
        onPause={pauseAop}
        onResume={resumeAop}
        onBack={() => showHint('Your AOPs are coming soon.')}
      />

      <div className={styles.stage}>
        <div className={styles.area}>
          <div className={styles.docScroll}>
            <div className={styles.doc}>
              <CoachmarkTriggers />

              {/* Frontmatter / Trigger */}
              <section className={styles.block}>
                <div className={styles.row}>
                  <span className={styles.gutter} aria-hidden />
                  <div className={styles.content}>
                    <h2 className={styles.label}>When should this run :</h2>
                    <div className={styles.triggerField}>
                      <EditorLine
                        fragments={doc.trigger}
                        placeholder={TRIGGER_PLACEHOLDER}
                        onChange={handleChange({ kind: 'trigger' })}
                        onEnter={handleEnter({ kind: 'trigger' })}
                        onRequestPalette={openPalette({ kind: 'trigger' })}
                        onChipConfig={openChipEdit({ kind: 'trigger' })}
                        autoFocus={focusFor('trigger')}
                        ariaLabel="When should this AOP run"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <div className={styles.divider} />

              {/* Describe Procedure */}
              <section className={styles.block}>
                <div className={styles.row}>
                  <span className={styles.gutter} aria-hidden />
                  <div className={styles.content}>
                    <h2 className={styles.label}>What should it do :</h2>
                  </div>
                </div>

                <ol
                  className={styles.steps}
                  ref={stepsListRef}
                  data-dragging={drag ? '' : undefined}
                >
                  {doc.steps.map((step, i) => {
                    // A drop indicator sits in the gap the dragged step would land in.
                    const dropBefore =
                      drag && dropIdx === i ? (
                        <li key={`drop-${i}`} className={styles.dropLine} aria-hidden />
                      ) : null;
                    // Condition block: rendered by ConditionBlock, with each branch's
                    // expression + body line as real EditorLines wired to 'cond' targets.
                    if (isCondition(step)) {
                      return [
                        dropBefore,
                        <li
                          key={step.id}
                          className={styles.row}
                          data-step-row
                          data-step-id={step.id}
                          data-dragging={drag?.id === step.id || undefined}
                        >
                          {renderDragHandle(step.id, i)}
                          <span className={styles.gutter}>
                            <GutterMarker n={i + 1} />
                          </span>
                          <div className={styles.content}>
                            <ConditionBlock
                              branches={step.branches}
                              onAddBranch={(type) => {
                                const br = api.addBranch(step.id, type);
                                // else has no expression - land in its first body line; else-if lands in its expr
                                requestFocus(
                                  lineKey(
                                    type === 'else'
                                      ? {
                                          kind: 'cond',
                                          condId: step.id,
                                          branchId: br.id,
                                          part: 'body',
                                          lineId: br.lines[0]?.id,
                                        }
                                      : { kind: 'cond', condId: step.id, branchId: br.id, part: 'expr' },
                                  ),
                                  true,
                                );
                              }}
                              onChangeBranchType={(branchId, type) => {
                                api.changeBranchType(step.id, branchId, type);
                                // keep the caret on the arm just re-decided (its expr, or body for else).
                                // changeBranchType preserves the arm's lines, so read the first line id here.
                                const firstLineId = step.branches.find((br) => br.id === branchId)
                                  ?.lines[0]?.id;
                                requestFocus(
                                  lineKey(
                                    type === 'else'
                                      ? {
                                          kind: 'cond',
                                          condId: step.id,
                                          branchId,
                                          part: 'body',
                                          lineId: firstLineId,
                                        }
                                      : { kind: 'cond', condId: step.id, branchId, part: 'expr' },
                                  ),
                                  false,
                                );
                              }}
                              onDeleteBranch={(branchId) => {
                                api.deleteBranch(step.id, branchId);
                                // return the caret to the IF expression (the anchor arm)
                                const ifId = step.branches[0]?.id;
                                if (ifId)
                                  requestFocus(
                                    lineKey({
                                      kind: 'cond',
                                      condId: step.id,
                                      branchId: ifId,
                                      part: 'expr',
                                    }),
                                    false,
                                  );
                              }}
                              renderExpr={(b) => {
                                const ct: LineTarget = {
                                  kind: 'cond',
                                  condId: step.id,
                                  branchId: b.id,
                                  part: 'expr',
                                };
                                return (
                                  <EditorLine
                                    fragments={b.condition ?? []}
                                    placeholder="condition"
                                    onChange={handleChange(ct)}
                                    // Enter from the condition drops into the arm's first action line.
                                    onEnter={() =>
                                      requestFocus(
                                        lineKey({
                                          kind: 'cond',
                                          condId: step.id,
                                          branchId: b.id,
                                          part: 'body',
                                          lineId: b.lines[0]?.id,
                                        }),
                                        true,
                                      )
                                    }
                                    onRequestPalette={openPalette(ct)}
                                    onBackspaceEmpty={
                                      b.type === 'if'
                                        ? undefined
                                        : () => api.deleteBranch(step.id, b.id)
                                    }
                                    noActions
                                    autoFocus={focusFor(lineKey(ct))}
                                    ariaLabel={`${b.type} condition`}
                                  />
                                );
                              }}
                              renderBody={(b, ln, li) => {
                                const bt: LineTarget = {
                                  kind: 'cond',
                                  condId: step.id,
                                  branchId: b.id,
                                  part: 'body',
                                  lineId: ln.id,
                                };
                                return (
                                  <EditorLine
                                    fragments={ln.body}
                                    placeholder={STEP_PLACEHOLDER}
                                    onChange={handleChange(bt)}
                                    // Enter adds another action line in the SAME arm (never a nested condition).
                                    onEnter={() => {
                                      const newLineId = api.addBranchLine(step.id, b.id, ln.id);
                                      requestFocus(
                                        lineKey({
                                          kind: 'cond',
                                          condId: step.id,
                                          branchId: b.id,
                                          part: 'body',
                                          lineId: newLineId,
                                        }),
                                        true,
                                      );
                                    }}
                                    onRequestPalette={openPalette(bt)}
                                    onChipConfig={openChipEdit(bt)}
                                    onBackspaceEmpty={() => {
                                      // Multi-line arm: backspace removes this empty line.
                                      if (b.lines.length > 1) {
                                        const focusId = api.removeBranchLine(step.id, b.id, ln.id);
                                        if (focusId)
                                          requestFocus(
                                            lineKey({
                                              kind: 'cond',
                                              condId: step.id,
                                              branchId: b.id,
                                              part: 'body',
                                              lineId: focusId,
                                            }),
                                            false,
                                          );
                                      } else if (b.type === 'else') {
                                        // ELSE has no expression line: backspace on its only empty body removes the arm.
                                        api.deleteBranch(step.id, b.id);
                                      }
                                      // if/else-if with a single body line: keep it (the arm needs one).
                                    }}
                                    autoFocus={focusFor(lineKey(bt))}
                                    ariaLabel={`${b.type} action ${li + 1}`}
                                  />
                                );
                              }}
                            />
                          </div>
                          {renderRowMenu(step.id, i)}
                        </li>,
                      ];
                    }

                    const t: LineTarget = { kind: 'step', id: step.id };
                    // Returns [stepRow, hintRow?] - React flattens arrays from map.
                    // The "@ for actions" pill (Figma 647:40172) follows ONLY the active
                    // line (bubbleStepId) - never every empty line. It's its OWN in-flow
                    // row beneath the step (not inside it) so it reserves its space: the
                    // step number stays aligned to the placeholder and the pill never
                    // overlaps a following step. The hint row pads left by the gutter
                    // width to sit on the content rail (under the placeholder).
                    return [
                      dropBefore,
                      <li
                        key={`${step.id}-row`}
                        className={styles.row}
                        data-step-row
                        data-step-id={step.id}
                        data-dragging={drag?.id === step.id || undefined}
                      >
                        {renderDragHandle(step.id, i)}
                        <span className={styles.gutter}>
                          <GutterMarker n={i + 1} />
                        </span>
                        <div className={styles.content}>
                          <EditorLine
                            fragments={step.body}
                            placeholder={STEP_PLACEHOLDER}
                            onChange={handleChange(t)}
                            onEnter={handleEnter(t)}
                            onBackspaceEmpty={handleBackspaceEmpty(t)}
                            onRequestPalette={openPalette(t)}
                            onChipConfig={openChipEdit(t)}
                            autoFocus={focusFor(`step:${step.id}`)}
                            onFocus={() => setActiveStepId(step.id)}
                            ariaLabel={`Step ${i + 1}`}
                          />
                        </div>
                        {renderRowMenu(step.id, i)}
                      </li>,
                      // The "@ for actions" hint is hidden while a drag is in progress.
                      step.id === bubbleStepId && !drag ? (
                        <li key={`${step.id}-hint`} className={styles.hintRow}>
                          <ActionHint onClick={(e) => openActionsFromPlus(t, e.currentTarget)} />
                        </li>
                      ) : null,
                    ];
                  })}
                  {drag && dropIdx === doc.steps.length && (
                    <li key="drop-end" className={styles.dropLine} aria-hidden />
                  )}
                </ol>
              </section>
            </div>
          </div>

          {/* The bottom "Ask a question" chat dock is redundant on the Copilot
            variants (the Copilot panel is the chat surface), and absent from the
            mockups - so it shows only on the non-Copilot editor routes. */}
          {!companions && (
            <div className={styles.chatDock}>
              <div className={styles.chatInner}>
                <ChatBar />
              </div>
            </div>
          )}
        </div>
        {/* /canvas: the docked side panel (Copilot | Simulate tabs), equal height
            to the canvas window. Non-companion routes (/api-example) keep the
            toolbar-toggled floating Simulate panel. */}
        {companions ? (
          coldPhase !== 'hero' && (
            <div
              ref={dockRef}
              data-morphing={coldPhase === 'morphing' || undefined}
              inert={coldPhase === 'morphing' || undefined}
              className={styles.dockSlot}
            >
              <SidePanel
                tab={panelTab}
                onTab={setPanelTab}
                copilot={{
                  messages: copilotMessages,
                  onSend: sendCopilot,
                  onRegenerate: regenerateCopilot,
                  onClear: clearCopilot,
                  introReady: coldPhase === 'docked', // false during 'morphing' so the intro waits for the dock to settle
                  onStop: stopCopilot,
                  busy: thinkIdx >= 0 || copilotMessages.some((m) => m.thinking || m.streaming),
                  onAttach: () => showHint('Attachments are coming soon.'),
                  onApplyProposal: applyProposal,
                  onDismissProposal: dismissProposal,
                  onUndoProposal: undoProposal,
                  onVerdict: setCopilotVerdict,
                }}
                sim={{
                  hasScenarios: lineHasContent(doc.trigger),
                  hasTrigger: lineHasContent(doc.trigger),
                  onAddTrigger: () => requestFocus('trigger', false),
                }}
              />
            </div>
          )
        ) : (
          <SimulatePanel
            open={simOpen}
            onClose={() => setSimOpen(false)}
            hasScenarios={lineHasContent(doc.trigger)}
            hasTrigger={lineHasContent(doc.trigger)}
            onAddTrigger={() => requestFocus('trigger', false)}
          />
        )}
      </div>

      {palette && (
        <CommandPalette
          anchor={palette.req.rect}
          initialScope={palette.req.scope}
          initialAction={palette.edit?.initialAction}
          initialPicked={palette.edit?.initialPicked}
          initialQuery={palette.edit?.initialQuery}
          onSelect={insertChip}
          onPreview={previewChip}
          onClose={closePalette}
          // No nested conditions: hide "Condition" when editing inside a branch body.
          noCondition={palette.target.kind === 'cond' && palette.target.part === 'body'}
        />
      )}

      {hint && (
        <div className={styles.toast} role="status">
          <span>{hint.msg}</span>
          {hint.action && (
            <button
              type="button"
              className={styles.toastAction}
              onClick={() => {
                hint.action!.run();
                setHint(null);
              }}
            >
              {hint.action.label}
            </button>
          )}
        </div>
      )}

      {coldStartOpen && (
        <ColdStartModal
          beforeExit={handleBeforeExit}
          onGenerate={handleColdStartGenerate}
          onDismiss={handleColdStartDismiss}
        />
      )}

      {coldPhase === 'morphing' && morphRects && (
        <CopilotMorph
          from={morphRects.from}
          to={morphRects.to}
          onDone={() => {
            setColdPhase('docked');
            setMorphRects(null);
          }}
        />
      )}

      {enableMode && (
        <EnableModal
          open
          mode={enableMode}
          name={enableName}
          onNameChange={setEnableName}
          selected={enableMailboxes}
          onSelectedChange={setEnableMailboxes}
          preEnabled={docUsesTags(doc) ? PRE_ENABLED_MAILBOXES : []}
          onClose={() => setEnableMode(null)}
          onConfirm={confirmEnable}
        />
      )}
    </div>
  );
}
