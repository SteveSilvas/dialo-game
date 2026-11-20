import { useSyncExternalStore } from 'react';

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const mediaQuery = (): MediaQueryList | null => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return null;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY);
};

const subscribe = (onChange: () => void) => {
  const query = mediaQuery();
  if (!query) return () => undefined;

  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};

const getSnapshot = () => mediaQuery()?.matches ?? false;

/**
 * `true` quando a criança pediu menos movimento no sistema. A celebração só
 * anima quando isto é `false`: quem tem sensibilidade a movimento recebe a
 * mesma tela, estática. `useSyncExternalStore` evita estado duplicado e já
 * acompanha a troca da preferência com a tela aberta.
 */
export const useReducedMotion = (): boolean =>
  useSyncExternalStore(subscribe, getSnapshot, () => false);
