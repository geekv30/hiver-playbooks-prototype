// POST /api/copilot/unlock - check a passcode without spending a model call.

import { availability, clientIp, passcodeOk, rateLimited, readConfig } from '@/lib/copilot/server';

export async function POST(req: Request) {
  const cfg = readConfig();
  if (!availability(cfg).configured) return Response.json({ ok: false, error: 'not_configured' }, { status: 503 });
  // Guesses count against the same budget as turns, so the gate cannot be
  // brute-forced faster than the route can be used.
  if (rateLimited(clientIp(req))) return Response.json({ ok: false, error: 'rate_limited' }, { status: 429 });
  const { passcode } = (await req.json().catch(() => ({}))) as { passcode?: string };
  const ok = passcodeOk(cfg, typeof passcode === 'string' ? passcode : null);
  return Response.json({ ok }, { status: ok ? 200 : 401 });
}
