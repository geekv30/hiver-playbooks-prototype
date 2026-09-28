// POST /api/evaluate - one step of a chat evaluation, on the live model.
//
// kind 'skill'     { doc, transcript, actionsTaken, skillStarted } -> a checked turn
// kind 'customer'  { scenario, transcript }                  -> the AI customer's next message
// kind 'scenarios' { doc }                                   -> chat test scenarios for this skill
// kind 'judge'     { doc, transcript, goal, actions }         -> did the chat actually go well
//
// Same key, passcode and gate as Copilot. The skill turn is checked against
// the skill here (lib/eval/wire.checkTurn), so the editor only ever renders a
// trace that names real steps, and its outcome never comes from the model.

import type { EditorDoc } from '@/components/flow01/doc';
import { availability, clientIp, passcodeOk, rateLimited, readConfig, type CopilotConfig } from '@/lib/copilot/server';
import {
  CUSTOMER_TURN_SCHEMA,
  JUDGE_SCHEMA,
  SCENARIOS_SCHEMA,
  SKILL_TURN_SCHEMA,
  checkTurn,
  indexSkill,
  plain,
  skillToWire,
  transcriptToWire,
  type ChatMessage,
  type ChatScenario,
  type CustomerTurnWire,
  type JudgeWire,
  type SkillTurnWire,
} from '@/lib/eval/wire';
import { customerPrompt, judgePrompt, scenariosPrompt, skillTurnPrompt } from '@/lib/eval/server';

export const maxDuration = 60;

const MAX_BODY = 200_000;
const MAX_TURNS = 40;
const MAX_CHARS = 2_000;
// A chat evaluation spends a call per turn: a full AI scenario is about 18
// (up to 8 customer turns, 8 agent turns, the scenario list and the review),
// so the budget has to cover a reviewer running several back to back. The
// spend cap on the key is the real limit.
const EVAL_BUDGET = 300;
// A turn is a long structured answer, so effort costs seconds a live chat
// cannot spare. Explicit, because leaving it out means the model's default.
const EFFORT = process.env.OPENAI_EVAL_REASONING?.trim() || 'none';

type Body =
  | {
      kind: 'skill';
      doc: EditorDoc;
      transcript: ChatMessage[];
      actionsTaken?: string[];
      skillStarted?: boolean;
    }
  | { kind: 'customer'; scenario: ChatScenario; transcript: ChatMessage[] }
  | { kind: 'scenarios'; doc: EditorDoc }
  | {
      kind: 'judge';
      doc: EditorDoc;
      transcript: ChatMessage[];
      goal?: string | null;
      actions?: string[];
      rating?: { score: number; comment: string | null } | null;
    };

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

function cleanTranscript(t: unknown): ChatMessage[] {
  if (!Array.isArray(t)) return [];
  return t
    .filter(
      (m): m is ChatMessage =>
        !!m && (m.role === 'customer' || m.role === 'agent') && typeof m.text === 'string' && !!m.text.trim(),
    )
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, text: m.text.slice(0, MAX_CHARS) }));
}

// A single model call never gets to hold the function until the platform
// kills it (a stalled upstream once did, and the user saw a bare 504): each
// call is capped, and the whole request keeps its own budget for a retry.
const CALL_TIMEOUT_MS = 25_000;
const REQUEST_BUDGET_MS = 50_000;

class ModelTimeout extends Error {}

/** One structured, non-streamed call. Throws with a readable message. */
async function call<T>(cfg: CopilotConfig, instructions: string, input: string, name: string, schema: unknown, signal: AbortSignal): Promise<T> {
  const capped = AbortSignal.any([signal, AbortSignal.timeout(CALL_TIMEOUT_MS)]);
  try {
    return await callOnce<T>(cfg, instructions, input, name, schema, capped);
  } catch (e) {
    if (!signal.aborted && capped.aborted) throw new ModelTimeout('The model took too long to answer.');
    throw e;
  }
}

async function callOnce<T>(cfg: CopilotConfig, instructions: string, input: string, name: string, schema: unknown, signal: AbortSignal): Promise<T> {
  const r = await fetch(`${cfg.baseUrl}/responses`, {
    method: 'POST',
    headers: { authorization: `Bearer ${cfg.key}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: cfg.model,
      instructions,
      input: [{ role: 'user', content: input }],
      store: false,
      max_output_tokens: 2500,
      reasoning: { effort: EFFORT },
      text: { format: { type: 'json_schema', name, strict: true, schema } },
    }),
    signal,
  });
  const raw = await r.text();
  if (!r.ok) {
    let message = `OpenAI returned ${r.status}`;
    try {
      message = (JSON.parse(raw) as { error?: { message?: string } }).error?.message ?? message;
    } catch {}
    throw new Error(message);
  }
  const res = JSON.parse(raw) as {
    status?: string;
    incomplete_details?: { reason?: string };
    output?: { type: string; content?: { type: string; text?: string }[] }[];
  };
  if (res.status === 'incomplete') throw new Error(`The reply was cut off (${res.incomplete_details?.reason ?? 'incomplete'}).`);
  const text = res.output
    ?.filter((o) => o.type === 'message')
    .flatMap((o) => o.content ?? [])
    .find((c) => c.type === 'output_text')?.text;
  if (!text) throw new Error('The model returned nothing.');
  return JSON.parse(text) as T;
}

export async function POST(req: Request) {
  const cfg = readConfig();
  if (!availability(cfg).configured) return json(503, { error: 'not_configured' });
  if (!passcodeOk(cfg, req.headers.get('x-copilot-passcode'))) return json(401, { error: 'passcode' });
  if (rateLimited(clientIp(req), 'evaluate', EVAL_BUDGET)) return json(429, { error: 'rate_limited' });

  const began = Date.now();
  const raw = await req.text();
  if (raw.length > MAX_BODY) return json(413, { error: 'too_large' });
  let body: Body;
  try {
    body = JSON.parse(raw) as Body;
  } catch {
    return json(400, { error: 'bad_json' });
  }

  try {
    if (body.kind === 'skill') {
      if (!body.doc?.steps) return json(400, { error: 'bad_request' });
      const transcript = cleanTranscript(body.transcript);
      if (transcript[transcript.length - 1]?.role !== 'customer') return json(400, { error: 'bad_request' });
      const taken = (Array.isArray(body.actionsTaken) ? body.actionsTaken : []).slice(0, 40);
      const started = body.skillStarted === true;
      const input = [
        'The skill:',
        skillToWire(body.doc),
        '',
        `The skill has ${started ? 'already started' : 'not started yet'} in this chat.`,
        `Actions already taken earlier in this chat: ${taken.length ? taken.join('; ') : 'none'}`,
        '',
        'The chat so far:',
        transcriptToWire(transcript),
      ].join('\n');
      let turn = await call<SkillTurnWire>(cfg, skillTurnPrompt(), input, 'skill_turn', SKILL_TURN_SCHEMA, req.signal);
      let checked = checkTurn(body.doc, turn, started);
      // The model sometimes leaves a follow-up unanswered even though the
      // skill has a reply step. Ask once more before calling it a gap in the
      // skill - a slip of the model is not the author's to fix.
      if (
        checked.reason === 'noReply' &&
        indexSkill(body.doc).canReply &&
        Date.now() - began < REQUEST_BUDGET_MS - CALL_TIMEOUT_MS
      ) {
        turn = await call<SkillTurnWire>(
          cfg,
          skillTurnPrompt(),
          `${input}\n\nThe skill has a reply step on its path. Answer the customer's last message.`,
          'skill_turn',
          SKILL_TURN_SCHEMA,
          req.signal,
        );
        checked = checkTurn(body.doc, turn, started);
      }
      if (checked.dropped.length) console.warn('[evaluate] dropped from trace:', checked.dropped.join(' | '));
      return json(200, { turn: checked });
    }

    if (body.kind === 'customer') {
      const s = body.scenario;
      if (!s?.opening) return json(400, { error: 'bad_request' });
      const input = [
        `You are: ${s.persona.slice(0, 80)}`,
        `What you want: ${s.goal.slice(0, 400)}`,
        '',
        'The chat so far:',
        transcriptToWire(cleanTranscript(body.transcript)),
      ].join('\n');
      const turn = await call<CustomerTurnWire>(cfg, customerPrompt(), input, 'customer_turn', CUSTOMER_TURN_SCHEMA, req.signal);
      const rating = turn.done && typeof turn.rating === 'number' ? Math.min(5, Math.max(1, Math.round(turn.rating))) : null;
      return json(200, {
        turn: {
          message: plain(turn.message).slice(0, MAX_CHARS),
          done: turn.done,
          rating,
          comment: rating !== null && turn.comment ? plain(turn.comment).slice(0, 300) : null,
        },
      });
    }

    if (body.kind === 'scenarios') {
      if (!body.doc?.steps) return json(400, { error: 'bad_request' });
      const out = await call<{ scenarios: Omit<ChatScenario, 'id'>[] }>(
        cfg,
        scenariosPrompt(),
        `The skill:\n${skillToWire(body.doc)}`,
        'chat_scenarios',
        SCENARIOS_SCHEMA,
        req.signal,
      );
      const scenarios: ChatScenario[] = out.scenarios
        .filter((s) => s.opening?.trim())
        .slice(0, 6)
        .map((s, i) => ({ id: `gen-${Date.now().toString(36)}-${i}`, persona: plain(s.persona), goal: plain(s.goal), opening: plain(s.opening) }));
      return json(200, { scenarios });
    }

    if (body.kind === 'judge') {
      if (!body.doc?.steps) return json(400, { error: 'bad_request' });
      const actions = (Array.isArray(body.actions) ? body.actions : []).slice(0, 60);
      const input = [
        'The skill:',
        skillToWire(body.doc),
        '',
        `What the customer wanted: ${body.goal ? plain(body.goal).slice(0, 400) : 'not stated - infer it from the chat'}`,
        '',
        'The chat:',
        transcriptToWire(cleanTranscript(body.transcript)),
        '',
        'Steps the skill actually took, in order:',
        actions.length ? actions.map((a) => `- ${a}`).join('\n') : '- none',
        '',
        body.rating && typeof body.rating.score === 'number'
          ? `The customer rated the chat ${Math.round(body.rating.score)} out of 5${body.rating.comment ? `: "${plain(body.rating.comment).slice(0, 300)}"` : ''}.`
          : 'The customer did not rate the chat.',
      ].join('\n');
      const verdict = await call<JudgeWire>(cfg, judgePrompt(), input, 'chat_judge', JUDGE_SCHEMA, req.signal);
      // The customer's own word is a floor: a 1 or 2 out of 5 is never a pass.
      const unhappy = !!body.rating && body.rating.score <= 2;
      return json(200, {
        verdict: { verdict: unhappy && verdict.verdict !== 'unresolved' ? 'unresolved' : verdict.verdict, reason: plain(verdict.reason) },
      });
    }

    return json(400, { error: 'bad_request' });
  } catch (e) {
    if (req.signal.aborted) return json(499, { error: 'aborted' });
    if (e instanceof ModelTimeout) return json(504, { error: 'timeout', message: e.message });
    const message = (e as Error).message;
    // The account is out of credits: say so plainly, so the page can offer
    // the scripted replies instead of echoing OpenAI's billing text.
    if (/credit|quota|billing/i.test(message)) return json(402, { error: 'quota', message });
    return json(502, { error: 'upstream', message });
  }
}
