import { useEffect, useMemo, useState } from 'react';
import { Button, FilterGroup, KnightProgressRow, Panel, QuestCard, type AgentState } from '../components/ds';
import { statusWord, useAgent, type Quest } from '../lib/agentStore';
import { navigateTo, useRoute } from '../lib/useRoute';
import { ago, useNow } from '../lib/time';

type Bucket = 'active' | 'mediation' | 'stalled' | 'completed' | 'failed' | 'cancelled';
const BUCKETS: { id: Bucket; label: string }[] = [
  { id: 'active', label: 'Active' },
  { id: 'mediation', label: 'Mediation' },
  { id: 'stalled', label: 'Stalled' },
  { id: 'completed', label: 'Completed' },
  { id: 'failed', label: 'Failed' },
  { id: 'cancelled', label: 'Cancelled' },
];
const DEFAULT: Bucket[] = ['active', 'mediation', 'stalled'];
const PAGE = 24;

function bucketOf(q: Quest): Bucket {
  if (q.rawStatus === 'completed') return 'completed';
  if (q.rawStatus === 'failed') return 'failed';
  if (q.rawStatus === 'cancelled') return 'cancelled';
  if (q.stale) return 'stalled';
  return q.status === 'mediation' ? 'mediation' : 'active';
}

const PILL: Record<string, AgentState> = {
  pending: 'thinking', decomposed: 'executing', implemented: 'executing',
  testing_failed: 'mediating', completed: 'complete', failed: 'blocked', cancelled: 'idle',
};

function parse(search: string) {
  const p = new URLSearchParams(search);
  const raw = p.get('status');
  const selected = raw === 'all' ? BUCKETS.map((b) => b.id)
    : raw ? raw.split(',').filter((s): s is Bucket => BUCKETS.some((b) => b.id === s)) : DEFAULT;
  const quest = Number(p.get('quest')) || null;
  return { selected: new Set(selected), quest };
}

function hrefFor(selected: Set<Bucket>, quest: number | null) {
  const parts: string[] = [];
  const list = BUCKETS.map((b) => b.id).filter((id) => selected.has(id));
  const isDefault = list.length === DEFAULT.length && DEFAULT.every((d) => selected.has(d));
  if (!isDefault) parts.push(`status=${list.length === BUCKETS.length ? 'all' : list.join(',') || 'none'}`);
  if (quest) parts.push(`quest=${quest}`);
  return `/quests${parts.length ? `?${parts.join('&')}` : ''}`;
}

export function QuestsView() {
  const snapshot = useAgent((s) => s.snapshot);
  const connection = useAgent((s) => s.connection);
  const { search } = useRoute();
  const now = useNow();
  const { selected, quest: openId } = parse(search);
  const [limit, setLimit] = useState(PAGE);

  const quests = useMemo(() => snapshot?.quests ?? [], [snapshot]);
  const counts = useMemo(() => {
    const c: Record<Bucket, number> = { active: 0, mediation: 0, stalled: 0, completed: 0, failed: 0, cancelled: 0 };
    for (const q of quests) c[bucketOf(q)]++;
    return c;
  }, [quests]);
  const visible = quests.filter((q) => selected.has(bucketOf(q)));

  // Deep link to a quest outside the current filter: widen the filter so the card is on screen.
  useEffect(() => {
    const { selected: sel, quest: id } = parse(search);
    const q = id ? quests.find((x) => x.id === id) : undefined;
    if (!q) return;
    if (!sel.has(bucketOf(q))) navigateTo(hrefFor(new Set([...sel, bucketOf(q)]), id), { replace: true, scroll: false });
    else document.getElementById(`quest-${id}`)?.scrollIntoView({ block: 'nearest' });
  }, [quests, search]);

  if (!snapshot) {
    return (
      <Panel as="section" aria-label="Connecting">
        <div className="empty">
          <h3>{connection === 'offline' ? 'Round Table unreachable' : 'Loading quests…'}</h3>
          <p>Quests come from the Agentic OS database through the live stream.</p>
        </div>
      </Panel>
    );
  }

  const roster = snapshot.roster;
  const toggleBucket = (id: string, on: boolean) => {
    const next = new Set(selected);
    if (on) next.add(id as Bucket); else next.delete(id as Bucket);
    setLimit(PAGE);
    navigateTo(hrefFor(next, openId), { replace: true, scroll: false });
  };
  const toggleQuest = (id: number) => navigateTo(hrefFor(selected, openId === id ? null : id), { replace: true, scroll: false });

  return (
    <div className="quests-layout">
      <aside className="quests-filters" aria-label="Filters">
        <FilterGroup legend="Status" onChange={toggleBucket}
          options={BUCKETS.map((b) => ({ id: b.id, label: b.label, count: counts[b.id], checked: selected.has(b.id) }))} />
        <p className="panel-note">Domain filters (coding, writing, strategy) arrive when tasks carry a domain.</p>
      </aside>

      <section aria-label="Quests" className="quests-main">
        <p className="panel-note quests-count" aria-live="polite">
          {visible.length} of {quests.length} quests · newest first
        </p>
        {visible.length === 0 ? (
          <Panel><div className="empty"><h3>No quests match</h3><p>Tick more statuses on the left to see them.</p></div></Panel>
        ) : (
          <div className="quest-grid">
            {visible.slice(0, limit).map((q) => {
              const isOpen = openId === q.id;
              const word = statusWord(q.rawStatus);
              return (
                <div key={q.id} id={`quest-${q.id}`} className={isOpen ? 'quest-cell quest-cell--open' : 'quest-cell'}>
                  <QuestCard id={q.id} title={`Quest #${q.id}`} subtitle={q.title}
                    state={q.stale ? 'idle' : PILL[q.rawStatus] ?? 'idle'}
                    stateLabel={q.stale ? `stalled · ${word}` : word}
                    meta={`opened ${ago(q.createdAt, now)} · ${q.iterations} iteration${q.iterations === 1 ? '' : 's'}`}
                    open={isOpen} selected={isOpen} onToggle={() => toggleQuest(q.id)}>
                    {q.summary && q.summary.replace(/\s+/g, ' ') !== q.title && <p className="quest-summary">{q.summary}</p>}
                    {q.cause && <p className="quest-cause"><span className="ex-pill" data-state="blocked">root cause</span> {snapshot.causes?.[q.cause] ?? q.cause}</p>}
                    {q.failure && <p className="quest-failure"><b>{q.rawStatus === 'cancelled' ? 'Why it was cancelled:' : 'Last error:'}</b> <code>{q.failure}</code></p>}
                    {q.seats.map((s) => {
                      const k = roster.find((r) => r.id === s.knight);
                      return <KnightProgressRow key={s.knight} name={k?.name ?? s.knight} role={k?.role ?? ''} state={s.state} stalled={q.stale} />;
                    })}
                  </QuestCard>
                </div>
              );
            })}
          </div>
        )}
        {visible.length > limit && (
          <div className="quests-more"><Button variant="ghost" onClick={() => setLimit((l) => l + PAGE)}>Show {Math.min(PAGE, visible.length - limit)} more</Button></div>
        )}
      </section>
    </div>
  );
}
