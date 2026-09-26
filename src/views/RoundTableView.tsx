import { lazy, Suspense } from 'react';
import { Panel } from '../components/ds';

// Three.js is heavy; load it only on this view.
const RoundTableCanvas = lazy(() => import('../components/RoundTableCanvas'));

export function RoundTableView() {
  return (
    <>
      <header className="view-head">
        <p>Immersive view. The live, data-driven table replaces this as the default in a later step.</p>
      </header>
      <Panel tone="arcane" flat as="section" aria-label="Immersive Round Table">
        <div className="immersive">
          <Suspense fallback={<p style={{ color: 'var(--ink-2)' }}>Loading the table…</p>}>
            <RoundTableCanvas />
          </Suspense>
        </div>
      </Panel>
    </>
  );
}
