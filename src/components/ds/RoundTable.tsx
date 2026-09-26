import type { AgentState } from './types';

export interface RoundTableQuest { id: number; label: string; title: string; seats: AgentState[]; }
interface RoundTableProps {
  hub: { label: string; seats: AgentState[] };
  quests: RoundTableQuest[];
  overflow?: number;
  onSelect?: (questId: number) => void;
}

const W = 900, H = 520, CX = W / 2, CY = H / 2, RX = 330, RY = 180;

function Table({ x, y, rx, ry, lines, seats, hub }: { x: number; y: number; rx: number; ry: number; lines: string[]; seats: AgentState[]; hub?: boolean }) {
  return (
    <>
      <ellipse cx={x} cy={y + 6} rx={rx + 10} ry={ry + 6} className="rt-table-ring" />
      <ellipse cx={x} cy={y} rx={rx} ry={ry} className="rt-table" />
      <ellipse cx={x} cy={y} rx={rx * 0.72} ry={ry * 0.72} className="rt-table-ring" />
      <text x={x} y={y - (lines.length - 1) * 8 + 4} className="rt-label">
        {lines.map((l, i) => <tspan key={i} x={x} dy={i ? 16 : 0}>{l}</tspan>)}
      </text>
      {seats.map((st, i) => {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / seats.length;
        return (
          <circle key={i} cx={x + Math.cos(a) * (rx + 20)} cy={y + Math.sin(a) * (ry + 14)} r={hub ? 8 : 7} className="rt-seat" data-state={st}>
            <title>{`Seat ${i + 1}: ${st}`}</title>
          </circle>
        );
      })}
    </>
  );
}

const split = (s: string, max = 16) => {
  const words = s.toUpperCase().split(/\s+/);
  const out: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max) { if (cur) out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
    if (out.length === 2) break;
  }
  if (out.length < 2 && cur) out.push(cur);
  return out.slice(0, 2).map((l) => (l.length > max ? l.slice(0, max - 1) + '…' : l));
};

export function RoundTable({ hub, quests, overflow = 0, onSelect }: RoundTableProps) {
  const n = quests.length + (overflow > 0 ? 1 : 0);
  const pos = (i: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / Math.max(n, 1);
    return { x: CX + Math.cos(a) * RX, y: CY + Math.sin(a) * RY };
  };
  const executing = (s: AgentState[]) => s.includes('executing');

  return (
    <svg className="ex-rt" viewBox={`0 0 ${W} ${H}`} role="group" aria-label="Round Table quest network">
      {quests.map((q, i) => {
        const { x, y } = pos(i);
        const mx = (CX + x) / 2 + (y - CY) * 0.25, my = (CY + y) / 2 - (x - CX) * 0.08;
        return <path key={`c${q.id}`} d={`M${CX} ${CY} Q${mx} ${my} ${x} ${y}`} className="rt-conduit" data-active={executing(q.seats) ? '' : undefined} />;
      })}
      {quests.map((q, i) => {
        const { x, y } = pos(i);
        return (
          <g key={q.id} className="rt-node" tabIndex={0} role="button"
            aria-label={`Quest ${q.id}: ${q.title}. Seats: ${q.seats.join(', ')}`}
            onClick={() => onSelect?.(q.id)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(q.id); } }}>
            <title>{q.title}</title>
            <Table x={x} y={y} rx={78} ry={38} lines={[q.label, ...split(q.title).slice(0, 1)]} seats={q.seats} />
          </g>
        );
      })}
      {overflow > 0 && (() => { const { x, y } = pos(quests.length); return (
        <g className="rt-node" aria-label={`${overflow} more quests`}><Table x={x} y={y} rx={60} ry={30} lines={[`+${overflow}`, 'MORE']} seats={[]} /></g>
      ); })()}
      <g className="rt-node rt-hub" tabIndex={0} role="button" aria-label={`${hub.label}. Seats: ${hub.seats.join(', ')}`}>
        <Table x={CX} y={CY} rx={96} ry={48} lines={split(hub.label, 14)} seats={hub.seats} hub />
      </g>
    </svg>
  );
}
