import { lazy, Suspense } from 'react';
import { Panel } from '../components/ds';

const RevenueEngineCanvas = lazy(() => import('../components/RevenueEngineCanvas'));

const SAMPLE_PROPS: [string, string][] = [
  ['Topology', 'Aero-composite structural net'],
  ['High density', '65%'],
  ['Resilience', 'High'],
  ['Status', 'Nominal'],
];

export function StrategyView() {
  return (
    <>
      <header className="view-head">
        <p>Materials research beside the revenue model. Both panels show sample data until their endpoints exist.</p>
      </header>
      <div className="two-col">
        <Panel tone="arcane" as="section" aria-label="Advanced materials lab">
          <div className="view-head" style={{ marginBottom: 'var(--space-4)' }}>
            <h2>Advanced Materials Lab</h2>
            <div><span className="ex-pill" data-state="idle">Sample data</span></div>
          </div>
          <dl className="ex-props">
            {SAMPLE_PROPS.map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
        </Panel>
        <Panel tone="regal" as="section" aria-label="Revenue strategy engine">
          <div className="view-head" style={{ marginBottom: 'var(--space-4)' }}>
            <h2>Revenue Strategy Engine</h2>
            <div><span className="ex-pill" data-state="idle">Sample data</span></div>
          </div>
          <Suspense fallback={<p style={{ color: 'var(--ink-2)' }}>Loading the chart…</p>}>
            <RevenueEngineCanvas />
          </Suspense>
        </Panel>
      </div>
    </>
  );
}
