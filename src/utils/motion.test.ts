import { prefersReducedMotion } from './motion';

const mockMatchMedia = (matches: boolean) => {
  window.matchMedia = jest.fn().mockReturnValue({ matches }) as unknown as typeof window.matchMedia;
};

describe('prefersReducedMotion', () => {
  const original = window.matchMedia;

  afterEach(() => {
    window.matchMedia = original;
  });

  it('segue a preferência do sistema', () => {
    mockMatchMedia(true);
    expect(prefersReducedMotion()).toBe(true);

    mockMatchMedia(false);
    expect(prefersReducedMotion()).toBe(false);
  });

  it('pergunta pela media query de movimento reduzido', () => {
    mockMatchMedia(false);
    prefersReducedMotion();

    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });

  it('assume animação normal quando matchMedia não existe', () => {
    // @ts-expect-error jsdom de navegador antigo não implementa matchMedia.
    delete window.matchMedia;

    expect(prefersReducedMotion()).toBe(false);
  });
});
