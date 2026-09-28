// GET /api/copilot/status - can the live Copilot run here, and does it need a
// passcode. Never cached: it reads the deploy's environment at request time.

import { availability, readConfig } from '@/lib/copilot/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cfg = readConfig();
  const a = availability(cfg);
  return Response.json({ ...a, model: a.configured ? cfg.model : null });
}
