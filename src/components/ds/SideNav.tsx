import type { ComponentType, MouseEvent } from 'react';

export interface NavItem { id: string; label: string; icon: ComponentType<{ 'aria-hidden'?: boolean }>; href: string; }

interface SideNavProps { items: NavItem[]; activeId: string; onNavigate: (href: string) => void; }

export function SideNav({ items, activeId, onNavigate }: SideNavProps) {
  const go = (href: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    onNavigate(href);
  };
  return (
    <nav className="ex-sidenav" aria-label="Primary">
      {items.map(({ id, label, icon: Icon, href }) => (
        <a key={id} className="ex-sidenav__item" href={href} onClick={go(href)} aria-current={id === activeId ? 'page' : undefined}>
          <Icon aria-hidden />
          {label}
        </a>
      ))}
    </nav>
  );
}
