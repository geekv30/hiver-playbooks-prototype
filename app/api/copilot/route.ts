// POST /api/copilot - one live Copilot turn.
//
// Body: { doc, history: [{ role, text }], message }. Streams newline-delimited
// JSON back: { t: 'delta', text } while the reply is written (text is the whole
// reply so far), then one { t: 'done', reply, proposal, proposalError } or
// { t: 'error', message }. The proposal is checked against the doc and the
// action library here, so the editor only ever offers a change it can apply.

import type { EditorDoc } from '@/components/flow01/doc';
import { checkWire, docToWire, TURN_SCHEMA, type WireTurn } from '@/lib/copilot/wire';
import {
  availability,
  clientIp,
  partialReply,
  passcodeOk,
  rateLimited,
  readConfig,
  systemPrompt,
} from '@/lib/copilot/server';

export const maxDuration = 60;

interface Body {
  doc: EditorDoc;
  history: { role: 'user' | 'assistant'; text: string }[];
  message: string;
}

const MAX_BODY = 200_000;
const MAX_TURNS = 12;
const MAX_TURN_CHARS = 4_000;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export async function POST(req: Request) {
  const cfg = readConfig();
  const { configured } = availability(cfg);
  if (!configured) return json(503, { error: 'not_configured' });
  if (!passcodeOk(cfg, req.headers.get('x-copilot-passcode'))) return json(401, { error: 'passcode' });
  if (rateLimited(clientIp(req))) return json(429, { error: 'rate_limited' });

  const raw = await req.text();
  if (raw.length > MAX_BODY) return json(413, { error: 'too_large' });
  let body: Body;
  try {
    body = JSON.parse(raw) as Body;
  } catch {
    return json(400, { error: 'bad_json' });
  }
  if (!body?.doc?.steps || typeof body.message !== 'string' || !body.message.trim()) {
    return json(400, { error: 'bad_request' });
  }

  const history = (Array.isArray(body.history) ? body.history : [])
    .filter((h) => (h.role === 'user' || h.role === 'assistant') && typeof h.text === 'string' && h.text.trim())
    .slice(-MAX_TURNS)
    .map((h) => ({ role: h.role, content: h.text.slice(0, MAX_TURN_CHARS) }));

  const input = [
    ...history,
    {
      role: 'user' as const,
      content: `The skill right now:\n\n${docToWire(body.doc)}\n\nMy message: ${body.message.slice(0, MAX_TURN_CHARS)}`,
    },
  ];

  const upstream = await fetch(`${cfg.baseUrl}/responses`, {
    method: 'POST',
    headers: { authorization: `Bearer ${cfg.key}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: cfg.model,
      instructions: systemPrompt(),
      input,
      stream: true,
      store: false,
      max_output_tokens: 6000,
      ...(cfg.reasoning ? { reasoning: { effort: cfg.reasoning } } : {}),
      text: { format: { type: 'json_schema', name: 'copilot_turn', strict: true, schema: TURN_SCHEMA } },
    }),
    signal: req.signal,
  }).catch((e: unknown) => e as Error);

  if (upstream instanceof Error) return json(502, { error: 'upstream', message: upstream.message });
  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => '');
    let message = `OpenAI returned ${upstream.status}`;
    try {
      message = (JSON.parse(detail) as { error?: { message?: string } }).error?.message ?? message;
    } catch {}
    return json(502, { error: 'upstream', message });
  }

  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const reader = upstream.body.getReader();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (o: unknown) => controller.enqueue(enc.encode(`${JSON.stringify(o)}\n`));
      let sse = '';
      let buf = '';
      let shown = '';
      let finished = false;

      const finish = () => {
        if (finished) return;
        finished = true;
        let turn: WireTurn;
        try {
          turn = JSON.parse(buf) as WireTurn;
        } catch {
          send({ t: 'error', message: 'The reply came back incomplete.' });
          return;
        }
        let proposal = turn.proposal;
        let proposalError: string[] | null = null;
        if (proposal) {
          const errs = checkWire(proposal, body.doc);
          if (errs.length) {
            proposalError = errs;
            proposal = null;
          }
        }
        send({ t: 'done', reply: turn.reply, proposal, proposalError });
      };

      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          sse += dec.decode(value, { stream: true });
          let cut: number;
          while ((cut = sse.indexOf('\n\n')) >= 0) {
            const block = sse.slice(0, cut);
            sse = sse.slice(cut + 2);
            const data = block
              .split('\n')
              .filter((l) => l.startsWith('data:'))
              .map((l) => l.slice(5).trim())
              .join('');
            if (!data || data === '[DONE]') continue;
            let ev: { type?: string; delta?: string; message?: string; response?: { error?: { message?: string }; incomplete_details?: { reason?: string } } };
            try {
              ev = JSON.parse(data);
            } catch {
              continue;
            }
            if (ev.type === 'response.output_text.delta' && ev.delta) {
              buf += ev.delta;
              const now = partialReply(buf);
              if (now !== shown) {
                shown = now;
                send({ t: 'delta', text: now });
              }
            } else if (ev.type === 'response.completed') {
              finish();
            } else if (ev.type === 'response.incomplete') {
              finished = true;
              send({
                t: 'error',
                message: `The reply was cut off (${ev.response?.incomplete_details?.reason ?? 'incomplete'}).`,
              });
            } else if (ev.type === 'response.failed' || ev.type === 'error') {
              finished = true;
              send({ t: 'error', message: ev.response?.error?.message ?? ev.message ?? 'The model failed.' });
            }
          }
        }
        if (!finished) finish();
      } catch (e) {
        if (!finished) send({ t: 'error', message: (e as Error).message || 'The stream broke.' });
      } finally {
        controller.close();
      }
    },
    cancel() {
      void reader.cancel();
    },
  });

  return new Response(stream, {
    headers: { 'content-type': 'application/x-ndjson; charset=utf-8', 'cache-control': 'no-store' },
  });
}
