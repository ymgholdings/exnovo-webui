// Exnovo Round Table — component contracts for exnovo-webui (React 19).
// Implementation: emit the class names in components/bundle.css. These types are documentation.

export type Tone = 'arcane' | 'regal' | 'aether';
/** The six agent states. One reducer maps SSE events onto these. */
export type AgentState = 'idle' | 'thinking' | 'executing' | 'mediating' | 'blocked' | 'complete';

export interface PanelProps { tone?: Tone; selected?: boolean; flat?: boolean; inset?: boolean; as?: 'div' | 'section' | 'article' | 'aside'; children: React.ReactNode; }
export interface TopBarProps { title: string; onMenu?: () => void; }
export interface NavItem { id: string; label: string; icon: React.ComponentType; href: string; }
export interface SideNavProps { items: NavItem[]; activeId: string; }
export interface StatCardProps { label: string; value: string | number; tone: Tone; delta?: string; }
export interface StatusPillProps { state: AgentState; label?: string; }
export interface KnightProgress { knight: string; role: string; progress: number | null; state: AgentState; }
export interface KnightProgressRowProps extends KnightProgress {}
export interface Quest { id: string; title: string; subtitle?: string; domain: 'coding' | 'writing' | 'strategy'; status: 'active' | 'archived' | 'mediation'; knights: KnightProgress[]; heroImage?: string; }
export interface QuestCardProps { quest: Quest; open: boolean; selected?: boolean; onToggle: (id: string) => void; action?: { label: string; onClick: () => void }; }
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: 'default' | 'solid' | 'ghost'; }
export interface FilterOption { id: string; label: string; checked: boolean; }
export interface FilterGroupProps { legend: string; options: FilterOption[]; onChange: (id: string, checked: boolean) => void; }
export interface FeedEvent { id: string; kind: 'initialized' | 'progress' | 'conflict' | 'resolved' | 'strategy' | 'complete' | 'failed'; title: string; actors: string[]; detail?: string; cost_usd?: number; at: string; count?: number; }
export interface ActivityFeedProps { events: FeedEvent[]; maxItems?: number; }
export interface Knight { id: string; name: string; role: string; model: string; tone: 'arcane' | 'regal'; portrait?: string; summary: string; state: AgentState; }
export interface KnightCardProps { knight: Knight; showState?: boolean; }
export interface PropertyListProps { title: string; items: { label: string; value: string | number; unit?: string }[]; }
export interface RoundTableProps { hub: { label: string; seats: AgentState[] }; quests: { id: string; name: string; seats: AgentState[] }[]; onSelect?: (questId: string) => void; }
