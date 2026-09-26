import type { Tone } from './types';
import { Panel } from './Panel';

interface StatCardProps { label: string; value: string | number; tone: Tone; delta?: string; alert?: 'warn' | 'critical'; }

export function StatCard({ label, value, tone, delta, alert }: StatCardProps) {
  return (
    <Panel tone={tone} className={`ex-stat ex-stat--${tone}${alert ? ` ex-panel--${alert}` : ''}`}>
      <span className="ex-stat__label">{label}</span>
      <span className="ex-stat__value">{value}</span>
      {delta && <span className="ex-stat__delta">{delta}</span>}
    </Panel>
  );
}
