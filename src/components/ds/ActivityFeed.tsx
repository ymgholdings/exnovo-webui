import type { Activity, ActivityKind } from '../../lib/agentStore';
import { statusWord } from '../../lib/agentStore';
import { ago } from '../../lib/time';

const TONE: Record<ActivityKind, string | undefined> = {
  initialized: undefined, progress: undefined, conflict: 'warn', resolved: 'aether', complete: 'aether', failed: 'critical',
};

export function ActivityFeed({ items, now, max = 8 }: { items: Activity[]; now: number; max?: number }) {
  return (
    <ol className="ex-feed" aria-live="polite">
      {items.slice(0, max).map((a) => (
        <li key={a.id} className="ex-feed__item">
          <span className="ex-feed__dot" data-tone={TONE[a.kind]} />
          <div>
            <p className="ex-feed__title">Quest #{a.questId} {statusWord(a.status)}</p>
            <div className="ex-feed__meta">
              <span><b>{a.title}</b></span>
              <time dateTime={a.at}>{a.live ? ago(a.at, now) : `opened ${ago(a.at, now)}`}</time>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
