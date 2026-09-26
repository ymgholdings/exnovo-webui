import type { ReactNode } from 'react';
import type { Tone } from './types';

interface PanelProps {
  tone?: Tone;
  selected?: boolean;
  flat?: boolean;
  inset?: boolean;
  as?: 'div' | 'section' | 'article' | 'aside';
  className?: string;
  children: ReactNode;
  'aria-label'?: string;
}

export function Panel({ tone, selected, flat, inset, as: Tag = 'div', className, children, ...rest }: PanelProps) {
  const cls = [
    'ex-panel',
    tone && `ex-panel--${tone}`,
    selected && 'ex-panel--selected',
    flat && 'ex-panel--flat',
    inset && 'ex-panel--inset',
    className,
  ].filter(Boolean).join(' ');
  return <Tag className={cls} {...rest}>{children}</Tag>;
}
