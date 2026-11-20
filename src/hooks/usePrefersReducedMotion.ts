import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

const readPreference = (): boolean =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(QUERY).matches
    : false;

const subscribe = (onChange: () => void) => {
  if (typeof window.matchMedia !== 'function') return () => {};

  const query = window.matchMedia(QUERY);
  query.addEventListener('change', onChange);

  return () => query.removeEventListener('change', onChange);
};

/**
 * `prefers-reduced-motion` do sistema. O CSS já zera as animações nesse modo,
 * mas a trilha também usa o valor em JavaScript para não montar a pulsação e
 * para posicionar a rolagem sem deslizamento.
 */
export const usePrefersReducedMotion = (): boolean =>
  useSyncExternalStore(subscribe, readPreference, () => false);
