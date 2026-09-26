import { ActivityFeed, Button, Panel, RoundTable, StatCard, type AgentState, type RoundTableQuest } from '../components/ds';
import { useAgent, type Quest, type Knight } from '../lib/agentStore';
import { ago, useNow } from '../lib/time';
import { navigateTo } from '../lib/useRoute';

const MAX_TABLES = 7;
// Which seat state wins when summarising a knight across many quests.
const PRIORITY: AgentState[] = ['blocked', 'mediating', 'executing', 'thinking', 'complete', 'idle'];

function hubSeats(roster: Knight[], open: Quest[]): AgentState[] {
  return roster.map((k) => {
    const states = open.map((q) => q.seats.find((s) => s.knight === k.id)?.state ?? 'idle');
    return PRIORITY.find((p) => states.includes(p)) ?? 'idle';
  });
}

export function DashboardView() {
  const snapshot = useAgent((s) => s.snapshot);
  const connection = useAgent((s) => s.connection);
  const activity = useAgent((s) => s.activity);
  const now = useNow();

  if (!snapshot) {
    return (
      <Panel as="section" aria-label="Connecting">
        <div className="empty">
          <h3>{connection === 'offline' ? 'Round Table unreachable' : 'Connecting to the Round Table…'}</h3>
          <p>{connection === 'offline'
            ? 'The quest stream is not answering. The API service may be down; it retries every few seconds.'
            : 'Loading quests from the Agentic OS database.'}</p>
          <code>SSE /api/streaming</code>
        </div>
      </Panel>
    );
  }

  const { summary, quests, roster, health } = snapshot;
  const open = quests.filter((q) => q.status !== 'archived' && !q.stale);
  const shown = (open.length ? open : quests).slice(0, MAX_TABLES);
  const tables: RoundTableQuest[] = shown.map((q) => ({
    id: q.id, label: `#${q.id}`, title: q.title, seats: q.seats.map((s) => s.state),
  }));
  const overflow = (open.length ? open.length : quests.length) - shown.length;
  const online = health.db === 'up' && connection === 'live';
  const lastNew = summary.lastActivityAt ? ago(summary.lastActivityAt, now) : 'never';

  return (
    <>
      <section className="stat-row" aria-label="Summary">
        <StatCard label="Active Quests" value={summary.open} tone="arcane"
          delta={`${summary.stalled} stalled · ${summary.mediation} in mediation · ${summary.total} total`}
          alert={summary.stalled > 0 && summary.open === 0 ? 'warn' : undefined} />
        <StatCard label="Total Knights" value={summary.knights} tone="regal"
          delta={roster.map((k) => k.name).join(' · ')} />
        <StatCard label="Success Rate" value={summary.successRate === null ? '—' : `${summary.successRate}%`} tone="regal"
          delta={`${summary.completed} completed · ${summary.failed} failed · ${summary.cancelled ?? 0} cancelled`}
          alert={summary.successRate !== null && summary.successRate < 50 ? 'warn' : undefined} />
        <StatCard label="System Status" value={online ? 'ONLINE' : 'OFFLINE'} tone="aether"
          delta={online ? `database up · stream live` : health.db === 'down' ? 'database unreachable' : 'stream reconnecting'}
          alert={online ? undefined : 'critical'} />
      </section>

      <div className="dash-grid">
        <Panel as="section" aria-label="Quest network">
          <div className="panel-head">
            <h2>Quest network</h2>
            <span className="panel-note">{open.length ? `${open.length} open` : 'no open quests · showing recent'} · last new quest {lastNew}</span>
          </div>
          <RoundTable hub={{ label: 'Orchestrator Arthur', seats: hubSeats(roster, open) }} quests={tables} overflow={overflow}
            onSelect={(id) => navigateTo(`/quests?status=all&quest=${id}`)} />
          <div className="rt-legend">
            {(['idle', 'thinking', 'executing', 'mediating', 'blocked', 'complete'] as AgentState[]).map((s) => (
              <span key={s} className="ex-pill" data-state={s}>{s}</span>
            ))}
          </div>
        </Panel>
        <Panel as="section" aria-label="Recent activity">
          <div className="panel-head"><h2>Recent activity</h2></div>
          {activity.length ? <ActivityFeed items={activity} now={now} /> : <p className="panel-note">No quests recorded yet.</p>}
        </Panel>
        {summary.failed > 0 && (
          <Panel as="section" aria-label="Why runs fail" className="dash-causes">
            <div className="panel-head">
              <h2>Why runs fail</h2>
              <span className="panel-note">{summary.failed} failed quest{summary.failed === 1 ? '' : 's'} by root cause</span>
            </div>
            <ul className="cause-list">
              {Object.entries(summary.causes ?? {}).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).map(([c, n]) => (
                <li key={c}>
                  <span className="cause-bar" style={{ width: `${Math.round((n / summary.failed) * 100)}%` }} />
                  <span className="cause-label">{snapshot.causes?.[c] ?? c}</span>
                  <b className="cause-n">{n}</b>
                </li>
              ))}
            </ul>
            <Button variant="ghost" onClick={() => navigateTo('/quests?status=failed')}>See failed quests</Button>
          </Panel>
        )}
      </div>
    </>
  );
}
