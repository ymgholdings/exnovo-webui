import type { AgentState } from './types';

const VALUE: Record<AgentState, string> = {
  idle: 'waiting', thinking: 'thinking', executing: 'working', mediating: 'mediating', blocked: 'blocked', complete: 'complete',
};

interface KnightProgressRowProps { name: string; role: string; state: AgentState; progress?: number | null; stalled?: boolean; }

/** One knight's share of a quest. Pipeline stages have no measured percentage, so open work is indeterminate. */
export function KnightProgressRow({ name, role, state, progress = null, stalled = false }: KnightProgressRowProps) {
  const pct = progress ?? (state === 'complete' ? 100 : state === 'idle' || state === 'blocked' ? 0 : null);
  const moving = pct === null && !stalled;
  const tone = state === 'complete' ? 'aether' : state === 'executing' ? undefined : 'arcane';
  return (
    <div className="ex-progress">
      <div className="ex-progress__head">
        <span className="ex-progress__name">{name}</span>
        <span className="ex-progress__role">({role})</span>
        <span className="ex-progress__value" data-state={state}>
          {pct !== null && state !== 'complete' && state !== 'idle' && state !== 'blocked' ? `${pct}% complete` : VALUE[state]}
          {stalled && state !== 'complete' && state !== 'idle' ? ' · stalled' : ''}
        </span>
      </div>
      <div className="ex-progress__track">
        <div className="ex-progress__fill" data-tone={tone}
          data-indeterminate={moving ? '' : undefined}
          style={{ width: pct === null ? (stalled ? '30%' : undefined) : `${pct}%` }} />
      </div>
    </div>
  );
}
