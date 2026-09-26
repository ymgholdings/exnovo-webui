import { Panel, StatCard } from '../components/ds';

export function DashboardView() {
  return (
    <>
      <section className="stat-row" aria-label="Summary">
        <StatCard label="Active Quests" value="—" tone="arcane" delta="awaiting /api/quests" />
        <StatCard label="Total Knights" value="—" tone="regal" delta="awaiting /api/knights" />
        <StatCard label="Revenue Strategy" value="—" tone="regal" delta="awaiting /api/strategy" />
        <StatCard label="System Status" value="—" tone="aether" delta="awaiting /api/health" />
      </section>
      <div className="two-col">
        <Panel as="section" aria-label="Quest network">
          <div className="empty">
            <h3>Quest network</h3>
            <p>Arthur's table and one table per active quest will appear here once the quest list is connected.</p>
            <code>GET /api/quests · SSE /api/streaming</code>
          </div>
        </Panel>
        <Panel as="section" aria-label="Recent activity">
          <div className="empty">
            <h3>Recent activity</h3>
            <p>Quest events stream here: initialized, conflicts, mediations, completions.</p>
            <code>SSE event: activity</code>
          </div>
        </Panel>
      </div>
    </>
  );
}
