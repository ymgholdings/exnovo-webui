// Agent state for the whole app: one EventSource, one store, selectors via useSyncExternalStore.
// The server sends full snapshots; this module derives activity by diffing them. Pure logic is
// exported (applySnapshot) and unit-tested in agentStore.test.ts.
import { useSyncExternalStore } from 'react';
import type { AgentState } from '../components/ds/types';

export interface Seat { knight: string; state: AgentState; }
export interface Quest {
  id: number; title: string; rawStatus: string;
  status: 'active' | 'mediation' | 'archived';
  iterations: number; createdAt: string | null; stale: boolean;
  summary: string; failure: string | null; cause: string | null; seats: Seat[];
}
export interface Summary {
  total: number; open: number; stalled: number; mediation: number; completed: number; failed: number; cancelled: number;
  causes: Record<string, number>;
  successRate: number | null; knights: number; lastActivityAt: string | null; lastActivityAgeHours: number | null;
}
export interface Knight { id: string; name: string; role: string; }
export interface Health { db: 'up' | 'down'; error: string | null; lastPollAt: string | null; }
export interface Snapshot { quests: Quest[]; summary: Summary; roster: Knight[]; causes: Record<string, string>; health: Health; }

export type ActivityKind = 'initialized' | 'progress' | 'conflict' | 'resolved' | 'complete' | 'failed';
export interface Activity { id: string; kind: ActivityKind; questId: number; title: string; status: string; at: string; live: boolean; }

export type Connection = 'connecting' | 'live' | 'offline';
export interface AgentStoreState { connection: Connection; snapshot: Snapshot | null; activity: Activity[]; }

const FEED_MAX = 30;

export function kindFor(rawStatus: string, isNew: boolean): ActivityKind {
  if (rawStatus === 'completed') return 'complete';
  if (rawStatus === 'failed') return 'failed';
  if (rawStatus === 'cancelled') return 'resolved';
  if (rawStatus === 'testing_failed') return 'conflict';
  if (isNew || rawStatus === 'pending') return 'initialized';
  return 'progress';
}

const STATUS_WORD: Record<string, string> = {
  pending: 'queued', decomposed: 'planned', implemented: 'implemented',
  testing_failed: 'tests failed', completed: 'completed', failed: 'failed', cancelled: 'cancelled',
};
export const statusWord = (s: string) => STATUS_WORD[s] ?? s.replace(/_/g, ' ');

/** Fold a new snapshot into state. First snapshot seeds the feed from history; later ones add real transitions. */
export function applySnapshot(prev: AgentStoreState, next: Snapshot, now: string): AgentStoreState {
  let activity: Activity[];
  if (!prev.snapshot) {
    activity = next.quests
      .filter((q) => q.createdAt)
      .slice(0, FEED_MAX)
      .map((q) => ({
        id: `seed-${q.id}`, kind: kindFor(q.rawStatus, false), questId: q.id,
        title: q.title, status: q.rawStatus, at: q.createdAt as string, live: false,
      }));
  } else {
    const before = new Map(prev.snapshot.quests.map((q) => [q.id, q.rawStatus]));
    const fresh: Activity[] = [];
    for (const q of next.quests) {
      const old = before.get(q.id);
      if (old === q.rawStatus) continue;
      const kind = old === 'testing_failed' && q.rawStatus !== 'failed' ? 'resolved' : kindFor(q.rawStatus, old === undefined);
      fresh.push({ id: `${q.id}-${q.rawStatus}-${now}`, kind, questId: q.id, title: q.title, status: q.rawStatus, at: now, live: true });
    }
    activity = [...fresh, ...prev.activity].slice(0, FEED_MAX);
  }
  return { connection: 'live', snapshot: next, activity };
}

// ---- the store ----
let state: AgentStoreState = { connection: 'connecting', snapshot: null, activity: [] };
const listeners = new Set<() => void>();
let source: EventSource | null = null;

function set(next: AgentStoreState) {
  state = next;
  listeners.forEach((l) => l());
}

function connect() {
  if (source || typeof EventSource === 'undefined') return;
  source = new EventSource('/api/streaming');
  source.addEventListener('snapshot', (e) => {
    try {
      set(applySnapshot(state, JSON.parse((e as MessageEvent).data) as Snapshot, new Date().toISOString()));
    } catch (err) {
      console.error('[agent-stream] bad snapshot', err);
    }
  });
  source.onopen = () => { if (state.connection !== 'live' && state.snapshot) set({ ...state, connection: 'live' }); };
  source.onerror = () => { if (state.connection !== 'offline') set({ ...state, connection: 'offline' }); };
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  connect();
  return () => { listeners.delete(cb); };
}

/** Read a slice of agent state. Keep selectors cheap and return stable references. */
export function useAgent<T>(select: (s: AgentStoreState) => T): T {
  return useSyncExternalStore(subscribe, () => select(state), () => select(state));
}
