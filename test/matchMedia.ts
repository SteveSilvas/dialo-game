/**
 * `matchMedia` não existe no jsdom. A trilha consulta
 * `prefers-reduced-motion`, então os testes precisam decidir a resposta.
 */
type Listener = (event: MediaQueryListEvent) => void;

const listeners = new Set<Listener>();
let prefersReducedMotion = false;

export const setPrefersReducedMotion = (value: boolean) => {
  prefersReducedMotion = value;
  const event = { matches: value } as MediaQueryListEvent;
  listeners.forEach((listener) => listener(event));
};

export const installMatchMedia = () => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string): MediaQueryList =>
      ({
        media: query,
        matches: query.includes('prefers-reduced-motion') ? prefersReducedMotion : false,
        onchange: null,
        addEventListener: (_type: string, listener: Listener) => {
          listeners.add(listener);
        },
        removeEventListener: (_type: string, listener: Listener) => {
          listeners.delete(listener);
        },
        addListener: (listener: Listener) => listeners.add(listener),
        removeListener: (listener: Listener) => listeners.delete(listener),
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  });
};

export const resetMatchMedia = () => {
  prefersReducedMotion = false;
  listeners.clear();
};
