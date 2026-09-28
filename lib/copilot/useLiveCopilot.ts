'use client';

// The editor's side of the live Copilot: is it available on this deploy, is it
// unlocked on this device, and one streamed turn.
//
// Availability comes from /api/copilot/status. The passcode, once accepted, is
// remembered in this browser only (hydrated after mount, never in a useState
// initializer - the routes are prerendered). Without it the editor keeps the
// scripted Copilot, so a shared demo link still works for anyone.

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import type { EditorDoc } from '@/components/flow01/doc';
import type { WireProposal } from './wire';

const KEY = 'hiver.copilot.passcode';
// "Turn off", remembered per browser - separate from the passcode, so it works
// where no passcode is needed and turning back on never re-asks for one.
const OFF_KEY = 'hiver.copilot.off';

export type LiveMode = 'unavailable' | 'locked' | 'live';

export interface LiveTurnResult {
  reply: string;
  proposal: WireProposal | null;
  proposalError: string[] | null;
}

export interface LiveCopilot {
  mode: LiveMode;
  model: string | null;
  /** Turning live on needs the passcode field (none needed, or already held: no). */
  needsPasscode: boolean;
  unlock: (passcode: string) => Promise<'ok' | 'wrong' | 'error'>;
  lock: () => void;
  /** One JSON call to another live route (the chat evaluation), with the
   *  passcode attached and the same errors as a Copilot turn. */
  post: <T>(path: string, body: unknown, signal?: AbortSignal) => Promise<T>;
  turn: (args: {
    doc: EditorDoc;
    history: { role: 'user' | 'assistant'; text: string }[];
    message: string;
    signal: AbortSignal;
    onText: (textSoFar: string) => void;
  }) => Promise<LiveTurnResult>;
}

export class LiveCopilotError extends Error {
  constructor(
    message: string,
    readonly kind: 'passcode' | 'rate_limited' | 'unavailable' | 'failed',
  ) {
    super(message);
  }
}

// The remembered passcode as a tiny external store: read on the client after
// hydration (the server snapshot is null), and every hook instance sees a
// change the moment one of them locks or unlocks.
const listeners = new Set<() => void>();
function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, v: string | null) {
  try {
    if (v === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, v);
  } catch {}
  listeners.forEach((l) => l());
}
const readStored = () => read(KEY);
const writeStored = (v: string | null) => write(KEY, v);
const readOff = () => read(OFF_KEY) === '1';
const writeOff = (off: boolean) => write(OFF_KEY, off ? '1' : null);
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useLiveCopilot(): LiveCopilot {
  const [status, setStatus] = useState<{ configured: boolean; passcodeRequired: boolean; model: string | null } | null>(null);
  const passcode = useSyncExternalStore(subscribe, readStored, () => null);
  const off = useSyncExternalStore(subscribe, readOff, () => false);

  useEffect(() => {
    let alive = true;
    fetch('/api/copilot/status', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => {
        if (alive && s) setStatus(s);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const needsPasscode = !!status?.passcodeRequired && !passcode;
  const mode: LiveMode = !status?.configured ? 'unavailable' : off || needsPasscode ? 'locked' : 'live';

  // Turning live on: straight back on when no passcode is needed or this
  // browser already holds one; otherwise check the code first.
  const unlock = useCallback(async (code: string) => {
    if (!needsPasscode) {
      writeOff(false);
      return 'ok' as const;
    }
    try {
      const r = await fetch('/api/copilot/unlock', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ passcode: code }),
      });
      if (r.ok) {
        writeStored(code);
        writeOff(false);
        return 'ok';
      }
      return r.status === 401 ? 'wrong' : 'error';
    } catch {
      return 'error';
    }
  }, [needsPasscode]);

  // "Turn off" keeps the passcode, so turning back on is one click.
  const lock = useCallback(() => writeOff(true), []);

  const turn = useCallback<LiveCopilot['turn']>(
    async ({ doc, history, message, signal, onText }) => {
      const r = await fetch('/api/copilot', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(passcode ? { 'x-copilot-passcode': passcode } : {}),
        },
        body: JSON.stringify({ doc, history, message }),
        signal,
      });
      if (!r.ok || !r.body) {
        const body = (await r.json().catch(() => ({}))) as { error?: string; message?: string };
        if (r.status === 401) {
          writeStored(null);
          throw new LiveCopilotError('The passcode is no longer valid.', 'passcode');
        }
        if (r.status === 429) throw new LiveCopilotError('Too many requests. Wait a few minutes.', 'rate_limited');
        if (r.status === 503) throw new LiveCopilotError('Live Copilot is not set up here.', 'unavailable');
        throw new LiveCopilotError(body.message ?? `Copilot request failed (${r.status}).`, 'failed');
      }

      const reader = r.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line) continue;
          const ev = JSON.parse(line) as
            | { t: 'delta'; text: string }
            | ({ t: 'done' } & LiveTurnResult)
            | { t: 'error'; message: string };
          if (ev.t === 'delta') onText(ev.text);
          else if (ev.t === 'done') return { reply: ev.reply, proposal: ev.proposal, proposalError: ev.proposalError };
          else throw new LiveCopilotError(ev.message, 'failed');
        }
      }
      throw new LiveCopilotError('The reply stopped before it finished.', 'failed');
    },
    [passcode],
  );

  const post = useCallback(
    async <T,>(path: string, body: unknown, signal?: AbortSignal): Promise<T> => {
      const r = await fetch(path, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(passcode ? { 'x-copilot-passcode': passcode } : {}),
        },
        body: JSON.stringify(body),
        signal,
      });
      const data = (await r.json().catch(() => ({}))) as T & { error?: string; message?: string };
      if (r.ok) return data;
      if (r.status === 401) {
        writeStored(null);
        throw new LiveCopilotError('The passcode is no longer valid.', 'passcode');
      }
      if (r.status === 429) throw new LiveCopilotError('Too many requests. Wait a few minutes.', 'rate_limited');
      if (r.status === 503) throw new LiveCopilotError('Live AI is not set up here.', 'unavailable');
      throw new LiveCopilotError(data.message ?? `The request failed (${r.status}).`, 'failed');
    },
    [passcode],
  );

  return { mode, model: status?.model ?? null, needsPasscode, unlock, lock, post, turn };
}
