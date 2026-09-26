import type { AgentState } from './types';

export function StatusPill({ state, label }: { state: AgentState; label?: string }) {
  return <span className="ex-pill" data-state={state}>{label ?? state}</span>;
}
