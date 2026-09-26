import { LayoutDashboard, Swords, Crown, ChartLine } from 'lucide-react';
import { SideNav, TopBar, Panel, type NavItem } from './components/ds';
import { useRoute } from './lib/useRoute';
import { DashboardView } from './views/DashboardView';
import { QuestsView } from './views/QuestsView';
import { RoundTableView } from './views/RoundTableView';
import { StrategyView } from './views/StrategyView';

const NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { id: 'quests', label: 'Quests', icon: Swords, href: '/quests' },
  { id: 'round-table', label: 'Round Table', icon: Crown, href: '/round-table' },
  { id: 'strategy', label: 'Strategy', icon: ChartLine, href: '/strategy' },
];

const ROUTES: Record<string, { id: string; title: string; View: () => React.JSX.Element }> = {
  '/': { id: 'dashboard', title: 'Dashboard Overview', View: DashboardView },
  '/quests': { id: 'quests', title: 'Quest Management', View: QuestsView },
  '/round-table': { id: 'round-table', title: "King Arthur's Round Table", View: RoundTableView },
  '/strategy': { id: 'strategy', title: 'Advanced Materials & Strategy', View: StrategyView },
};

function NotFound() {
  return (
    <Panel>
      <div className="empty">
        <h3>Page not found</h3>
        <p>That address isn't part of the Agentic OS. Use the menu to pick a view.</p>
      </div>
    </Panel>
  );
}

export function App() {
  const { path, navigate } = useRoute();
  const route = ROUTES[path.replace(/\/+$/, '') || '/'];
  const View = route?.View ?? NotFound;

  return (
    <div className="app-frame">
      <TopBar title={route?.title ?? 'Not found'} />
      <div className="app-body">
        <SideNav items={NAV} activeId={route?.id ?? ''} onNavigate={navigate} />
        <main className="app-main">
          <View />
        </main>
      </div>
    </div>
  );
}

export default App;
