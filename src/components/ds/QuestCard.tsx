import type { ReactNode } from 'react';
import type { AgentState } from './types';
import { Panel } from './Panel';

interface QuestCardProps {
  id: number;
  title: string;
  subtitle?: string;
  state: AgentState;
  stateLabel: string;
  meta: string;
  open: boolean;
  selected?: boolean;
  onToggle: () => void;
  children?: ReactNode;
}

export function QuestCard({ id, title, subtitle, state, stateLabel, meta, open, selected, onToggle, children }: QuestCardProps) {
  const bodyId = `quest-${id}-body`;
  return (
    <Panel as="article" tone={selected ? 'regal' : undefined} selected={selected} className="ex-quest" data-open={open ? '' : undefined}>
      <button className="ex-quest__head" type="button" aria-expanded={open} aria-controls={bodyId} onClick={onToggle}>
        <h3 className="ex-quest__title">{title}{subtitle && <small>{subtitle}</small>}</h3>
        <svg className="ex-quest__chev" viewBox="0 0 20 20" aria-hidden="true"><path d="M5 8l5 5 5-5" /></svg>
      </button>
      <div className="ex-quest__body" id={bodyId}>
        <div className="ex-quest__status">
          <span className="ex-pill" data-state={state}>{stateLabel}</span>
          <span className="panel-note">{meta}</span>
        </div>
        {open && children}
      </div>
    </Panel>
  );
}
