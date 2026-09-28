// POST /api/evaluate - one step of a chat evaluation, on the live model.
//
// kind 'skill'     { doc, transcript, actionsTaken, health } -> a checked turn
// kind 'customer'  { scenario, transcript }                  -> the AI customer's next message
// kind 'scenarios' { doc }                                   -> chat test scenarios for this skill
//
// Same key, passcode and gate as Copilot. The skill turn is checked against
// the skill here (lib/eval/wire.checkTurn), so the editor only ever renders a
// trace that names real steps, and its outcome never comes from the model.

import type { ConnectorSlug } from '@/types/playbook';
import type { EditorDoc } from '@/components/flow01/doc';
import type { ConnectorHealth } from '@/components/flow01/connectorHealth';
import { availability, clientIp, passcodeOk, rateLimited, readConfig, type CopilotConfig } from '@/lib/copilot/server';
import {
  CUSTOMER_TURN_SCHEMA,
  SCENARIOS_SCHEMA,
  SKILL_TURN_SCHEMA,
  checkTurn,
  skillToWire,
  transcriptToWire,
  type ChatMessage,
  type ChatScenario,
  type CustomerTurnWire,
  type SkillTurnWire,
} from '@/lib/eval/wire';
import { customerPrompt, scenariosPrompt, skillTurnPrompt } from '@/lib/eval/server';

export const maxDuration = 60;

const MAX_BODY = 200_000;
const MAX_TURNS = 40;
const MAX_CHARS = 2_000;
// A chat evaluation spends one call per turn (two per round in AI scenarios).
const EVAL_BUDGET = 90;
// A turn is a long structured answer, so effort costs seconds a live chat
// cannot spare. Explicit, because leaving it out means the model's default.
const EFFORT = process.env.OPENAI_EVAL_REASONING?.trim() || 'none';

type Body =
  | {
      kind: 'skill';
      doc: EditorDoc;
      transcript: ChatMessage[];
      actionsTaken?: string[];
      health?: Record<ConnectorSlug, ConnectorHealth>;
    }
  | { kind: 'customer'; scenario: ChatScenario; transcript: ChatMessage[] }
  | { kind: 'scenarios'; doc: EditorDoc };

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

function cleanTranscript(t: unknown): ChatMessage[] {
  if (!Array.isArray(t)) return [];
  return t
    .filter(
      (m): m is ChatMessage =>
        !!m && (m.role === 'customer' || m.role === 'skill') && typeof m.text === 'string' && !!m.text.trim(),
    )
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, text: m.text.slice(0, MAX_CHARS) }));
}

/** One structured, non-streamed call. Throws with a readable message. */
async function call<T>(cfg: CopilotConfig, instructions: string, input: string, name: string, schema: unknown, signal: AbortSignal): Promise<T> {
  const r = await fetch(`${cfg.baseUrl}/responses`, {
    method: 'POST',
    headers: { authorization: `Bearer ${cfg.key}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: cfg.model,
      instructions,
      input: [{ role: 'user', content: input }],
      store: false,
      max_output_tokens: 4000,
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
      const health = (body.health ?? {}) as Record<ConnectorSlug, ConnectorHealth>;
      const taken = (Array.isArray(body.actionsTaken) ? body.actionsTaken : []).slice(0, 40);
      const input = [
        'The skill:',
        skillToWire(body.doc, health),
        '',
        `Actions already taken earlier in this chat: ${taken.length ? taken.join('; ') : 'none'}`,
        '',
        'The chat so far:',
        transcriptToWire(transcript),
      ].join('\n');
      const turn = await call<SkillTurnWire>(cfg, skillTurnPrompt(), input, 'skill_turn', SKILL_TURN_SCHEMA, req.signal);
      const firstTurn = !transcript.some((m) => m.role === 'skill');
      return json(200, { turn: checkTurn(body.doc, turn, health, firstTurn) });
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
      return json(200, { turn: { message: turn.message.trim().slice(0, MAX_CHARS), done: turn.done } });
    }

    if (body.kind === 'scenarios') {
      if (!body.doc?.steps) return json(400, { error: 'bad_request' });
      const out = await call<{ scenarios: Omit<ChatScenario, 'id'>[] }>(
        cfg,
        scenariosPrompt(),
        `The skill:\n${skillToWire(body.doc, {} as Record<ConnectorSlug, ConnectorHealth>)}`,
        'chat_scenarios',
        SCENARIOS_SCHEMA,
        req.signal,
      );
      const scenarios: ChatScenario[] = out.scenarios
        .filter((s) => s.opening?.trim())
        .slice(0, 6)
        .map((s, i) => ({ id: `gen-${Date.now().toString(36)}-${i}`, persona: s.persona, goal: s.goal, opening: s.opening }));
      return json(200, { scenarios });
    }

    return json(400, { error: 'bad_request' });
  } catch (e) {
    if (req.signal.aborted) return json(499, { error: 'aborted' });
    return json(502, { error: 'upstream', message: (e as Error).message });
  }
}
