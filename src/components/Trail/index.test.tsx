import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Trail from './index';
import type { Activity, Module, ModuleStatus } from '../../api/types';
import { installMatchMedia, resetMatchMedia, setPrefersReducedMotion } from '../../../test/matchMedia';

const activity = (slug: string, order: number, overrides: Partial<Activity> = {}): Activity => ({
  slug,
  title: `Atividade ${order}`,
  type: 'selectSymbols',
  order,
  isRequired: true,
  configJson: '{}',
  progress: null,
  ...overrides,
});

const buildModule = (
  slug: string,
  order: number,
  status: ModuleStatus,
  overrides: Partial<Module> = {},
): Module => ({
  slug,
  title: `Módulo ${order}`,
  description: '',
  concept: '',
  order,
  status,
  isUnlocked: status !== 'locked',
  requiredTotal: 2,
  requiredCompleted: status === 'completed' ? 2 : 0,
  stars: status === 'completed' ? 6 : 0,
  maxStars: 6,
  activities: [activity('atividade-01', 1), activity('atividade-02', 2)],
  ...overrides,
});

const modules: Module[] = [
  buildModule('modulo-01', 1, 'completed'),
  buildModule('modulo-02', 2, 'current'),
  buildModule('modulo-03', 3, 'locked'),
];

const renderTrail = (props: { autoScroll?: boolean; modules?: Module[] } = {}) =>
  render(
    <MemoryRouter>
      <Trail modules={props.modules ?? modules} autoScroll={props.autoScroll ?? false} />
    </MemoryRouter>,
  );

beforeEach(() => {
  installMatchMedia();
  resetMatchMedia();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Trail', () => {
  it('renderiza os três módulos com o estado correto', () => {
    renderTrail();

    const completed = screen.getByRole('link', { name: /Módulo 1: Módulo 1\./i });
    const current = screen.getByRole('link', { name: /Módulo 2: Módulo 2\./i });
    const locked = screen.getByRole('group', { name: /Módulo 3: Módulo 3\./i });

    expect(completed).toHaveAttribute('data-state', 'completed');
    expect(current).toHaveAttribute('data-state', 'current');
    expect(locked).toHaveAttribute('data-state', 'locked');
  });

  it('explica o motivo do bloqueio citando o módulo anterior', () => {
    renderTrail();

    expect(
      screen.getByRole('group', { name: /Bloqueado: Conclua o módulo 2: Módulo 2/i }),
    ).toBeInTheDocument();
  });

  it('abre as atividades apenas dos módulos liberados', () => {
    renderTrail();

    const activityLinks = screen.getAllByRole('link', { name: /^Atividade 1: Atividade 1\./i });

    // Módulo 1 (concluído) e módulo 2 (atual) abrem ramos; o bloqueado não.
    expect(activityLinks).toHaveLength(2);
    expect(activityLinks[0]).toHaveAttribute('href', '/modulo-01/atividade-01');
    expect(activityLinks[1]).toHaveAttribute('href', '/modulo-02/atividade-01');
    expect(screen.queryByRole('link', { name: /Módulo 3/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /modulo-03/ })).not.toBeInTheDocument();
  });

  it('é navegável por teclado na ordem da trilha', async () => {
    renderTrail();

    await userEvent.tab();
    expect(screen.getByRole('link', { name: /Módulo 1/i })).toHaveFocus();

    await userEvent.tab();
    expect(screen.getAllByRole('link', { name: /^Atividade 1:/i })[0]).toHaveFocus();
  });

  it('expõe a trilha como navegação com nome acessível', () => {
    renderTrail();

    expect(screen.getByRole('navigation', { name: 'Trilha de módulos' })).toBeInTheDocument();
  });

  it('desenha o caminho num SVG decorativo, sem roubar o foco', () => {
    const { container } = renderTrail();

    const svg = container.querySelector('svg.trail__path');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
  });

  it('não pulsa o módulo atual para quem pediu menos movimento', () => {
    setPrefersReducedMotion(true);
    renderTrail();

    expect(screen.getByRole('link', { name: /Módulo 2/i })).not.toHaveClass(
      'trail-node--pulse',
    );
  });

  it('pulsa o módulo atual no movimento normal', () => {
    renderTrail();

    expect(screen.getByRole('link', { name: /Módulo 2/i })).toHaveClass(
      'trail-node--pulse',
    );
  });

  it('posiciona a rolagem no módulo atual ao abrir', () => {
    const scrollIntoView = jest.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      writable: true,
      value: scrollIntoView,
    });

    renderTrail({ autoScroll: true });

    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'center', behavior: 'smooth' });
  });

  it('rola sem deslizamento quando o movimento reduzido está ligado', () => {
    setPrefersReducedMotion(true);
    const scrollIntoView = jest.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      writable: true,
      value: scrollIntoView,
    });

    renderTrail({ autoScroll: true });

    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'center', behavior: 'auto' });
  });
});
