/**
 * `prefers-reduced-motion` do sistema. Quem pediu menos movimento não deve
 * esperar a animação de saída dos símbolos, e o `index.css` já encurta as
 * animações CSS nesse modo — o tempo do `setTimeout` acompanha.
 *
 * `matchMedia` não existe no jsdom nem em navegadores antigos: nesses casos o
 * jogo segue com a animação normal.
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};
