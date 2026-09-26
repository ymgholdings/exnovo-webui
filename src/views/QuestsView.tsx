import { Panel } from '../components/ds';

export function QuestsView() {
  return (
    <>
      <header className="view-head">
        <p>Every quest the knights are working on, filtered by status and domain.</p>
      </header>
      <Panel as="section" aria-label="Quest list">
        <div className="empty">
          <h3>No quests yet</h3>
          <p>Quests appear here once the orchestrator publishes them.</p>
          <code>GET /api/quests</code>
        </div>
      </Panel>
    </>
  );
}
