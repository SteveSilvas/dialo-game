import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

const mediaQuery = (): MediaQueryList | null => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return null;
  }
  return window.matchMedia(QUERY);
};

const subscribe = (onChange: () => void) => {
  const query = mediaQuery();
  if (!query) return () => undefined;

  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};

const getSnapshot = () => mediaQuery()?.matches ?? false;

/**
 * `true` quando a criança pediu menos movimento no sistema. O CSS já zera as
 * animações nesse modo, mas a trilha e a celebração também usam o valor em
 * JavaScript: sem ele, a pulsação seria montada e a rolagem deslizaria mesmo
 * com a preferência ligada.
 */
export const useReducedMotion = (): boolean =>
  useSyncExternalStore(subscribe, getSnapshot, () => false);
