import { useCallback, useSyncExternalStore } from 'react';

// Minimal history router: four static routes don't justify a dependency.
const subscribe = (cb: () => void) => {
  window.addEventListener('popstate', cb);
  return () => window.removeEventListener('popstate', cb);
};
const getPath = () => window.location.pathname;

export function useRoute() {
  const path = useSyncExternalStore(subscribe, getPath);
  const navigate = useCallback((href: string) => {
    if (href === window.location.pathname) return;
    window.history.pushState(null, '', href);
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo(0, 0);
  }, []);
  return { path, navigate };
}
