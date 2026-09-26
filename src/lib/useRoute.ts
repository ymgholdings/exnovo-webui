import { useCallback, useSyncExternalStore } from 'react';

// Minimal history router: four static routes don't justify a dependency.
// The snapshot is one string (path + query) so React sees a stable value between navigations.
const subscribe = (cb: () => void) => {
  window.addEventListener('popstate', cb);
  return () => window.removeEventListener('popstate', cb);
};
const getLocation = () => window.location.pathname + window.location.search;

export function navigateTo(href: string, { replace = false, scroll = true } = {}) {
  if (href === getLocation()) return;
  window.history[replace ? 'replaceState' : 'pushState'](null, '', href);
  window.dispatchEvent(new PopStateEvent('popstate'));
  if (scroll) window.scrollTo(0, 0);
}

export function useRoute() {
  const loc = useSyncExternalStore(subscribe, getLocation);
  const q = loc.indexOf('?');
  const path = q === -1 ? loc : loc.slice(0, q);
  const search = q === -1 ? '' : loc.slice(q);
  const navigate = useCallback((href: string) => navigateTo(href), []);
  return { path, search, navigate };
}
