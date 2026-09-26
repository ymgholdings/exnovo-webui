// Pure mapping from Agentic OS `tasks` rows to Round Table quests.
// No I/O here: everything is unit-tested in server/quests.test.mjs.

/** The pipeline roles, seated in order. Knight names are the Exnovo theme for each role. */
export const ROSTER = [
  { id: 'arthur', name: 'Arthur', role: 'Orchestrator' },
  { id: 'lancelot', name: 'Lancelot', role: 'Implementer' },
  { id: 'tristan', name: 'Tristan', role: 'Debugger' },
  { id: 'galahad', name: 'Galahad', role: 'Test executor' },
];

// Seat states per task status, in ROSTER order.
const SEATS = {
  pending:        ['thinking', 'idle', 'idle', 'idle'],
  decomposed:     ['complete', 'executing', 'idle', 'idle'],
  implemented:    ['complete', 'complete', 'executing', 'executing'],
  testing_failed: ['complete', 'complete', 'mediating', 'blocked'],
  completed:      ['complete', 'complete', 'complete', 'complete'],
  failed:         ['blocked', 'idle', 'idle', 'idle'],
};

const BUCKET = {
  pending: 'active', decomposed: 'active', implemented: 'active',
  testing_failed: 'mediation', completed: 'archived', failed: 'archived',
};

export const OPEN_BUCKETS = new Set(['active', 'mediation']);

/** An open quest with no progress for this long is treated as stalled, not active. */
export const STALE_HOURS = Number(globalThis.process?.env?.STALE_HOURS ?? 48);

/** First meaningful line of a spec, trimmed to a card title. */
export function titleFromSpec(spec) {
  const line = String(spec ?? '')
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l && !/^[=\-#*_\s]+$/.test(l)) ?? '';
  const clean = line.replace(/^#+\s*/, '').replace(/\s+/g, ' ');
  if (!clean) return 'Untitled quest';
  return clean.length > 72 ? clean.slice(0, 71).trimEnd() + '…' : clean;
}

/** A readable excerpt of the full spec for the quest detail view. */
export function excerpt(text, max = 420) {
  const t = String(text ?? '').replace(/^[=\-#*_\s]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
  return t.length > max ? t.slice(0, max - 1).trimEnd() + '…' : t;
}

/** The last meaningful line of an error trace: usually the exception that ended the run. */
export function failureReason(trace, max = 240) {
  const lines = String(trace ?? '').split('\n').map((l) => l.trim()).filter((l) => l && !/^[=\-~^\s]+$/.test(l));
  const last = lines.at(-1) ?? '';
  return last.length > max ? last.slice(0, max - 1).trimEnd() + '…' : last || null;
}

/** Agentic OS stores `timestamp without time zone` in UTC; a naive string must not be read as local time. */
export function asUtc(v) {
  if (typeof v !== 'string') return v;
  const t = v.trim().replace(' ', 'T');
  return /([zZ]|[+-]\d\d:?\d\d)$/.test(t) ? t : `${t}Z`;
}

export function toQuest(row, now = Date.now()) {
  const status = String(row.status ?? 'pending');
  const seats = SEATS[status] ?? ['idle', 'idle', 'idle', 'idle'];
  const created = row.created_at instanceof Date ? row.created_at : new Date(asUtc(row.created_at));
  const ageHours = Number.isNaN(created.getTime()) ? null : (now - created.getTime()) / 36e5;
  const stale = BUCKET[status] !== 'archived' && ageHours !== null && ageHours > STALE_HOURS;
  return {
    id: Number(row.id),
    title: titleFromSpec(row.spec),
    rawStatus: status,
    status: BUCKET[status] ?? 'active',
    iterations: Number(row.iteration_count ?? 0),
    createdAt: Number.isNaN(created.getTime()) ? null : created.toISOString(),
    stale,
    summary: excerpt(row.spec),
    failure: status === 'failed' || status === 'testing_failed' ? failureReason(row.error_trace) : null,
    seats: ROSTER.map((k, i) => ({ knight: k.id, state: seats[i] })),
  };
}

export function summarize(quests, now = Date.now()) {
  const count = (pred) => quests.filter(pred).length;
  const newest = quests.reduce((m, q) => (q.createdAt && q.createdAt > m ? q.createdAt : m), '');
  const done = count((q) => q.rawStatus === 'completed');
  const failed = count((q) => q.rawStatus === 'failed');
  const finished = done + failed;
  return {
    total: quests.length,
    open: count((q) => OPEN_BUCKETS.has(q.status) && !q.stale),
    stalled: count((q) => q.stale),
    mediation: count((q) => q.status === 'mediation' && !q.stale),
    completed: done,
    failed,
    successRate: finished ? Math.round((done / finished) * 100) : null,
    knights: ROSTER.length,
    lastActivityAt: newest || null,
    lastActivityAgeHours: newest ? Math.round((now - Date.parse(newest)) / 36e5) : null,
  };
}

/** Stable fingerprint so the stream only pushes when something changed. */
export function fingerprint(quests) {
  return quests.map((q) => `${q.id}:${q.rawStatus}:${q.iterations}:${q.stale ? 1 : 0}`).join('|');
}
