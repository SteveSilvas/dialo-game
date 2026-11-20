import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider, createStore } from 'jotai';
import ModuleConclusion from './index';
import { sessionAtom } from '../../../state/session';
import { setAccessToken } from '../../../api/client';

const fetchMock = jest.fn();
const jsonResponse = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => JSON.stringify(body),
});

const progress = (slug: string, bestScore: number, errors: number) => ({
  activitySlug: slug,
  bestScore,
  attempts: bestScore + errors,
  errors,
  stars: 3,
  completedAt: '2026-01-01T00:00:00+00:00',
});

const buildModule = (overrides: Record<string, unknown> = {}) => ({
  slug: 'modulo-01',
  title: 'Reconhecer letras',
  description: 'Distinguir símbolos.',
  concept: 'letras',
  order: 1,
  status: 'completed',
  isUnlocked: true,
  requiredTotal: 2,
  requiredCompleted: 2,
  stars: 6,
  maxStars: 6,
  activities: [
    {
      slug: 'atividade-01',
      title: 'Letras',
      type: 'selectSymbols',
      order: 1,
      isRequired: true,
      configJson: '{}',
      progress: progress('atividade-01', 8, 1),
    },
    {
      slug: 'atividade-02',
      title: 'Números',
      type: 'selectSymbols',
      order: 2,
      isRequired: true,
      configJson: '{}',
      progress: progress('atividade-02', 5, 2),
    },
  ],
  ...overrides,
});

const renderConclusion = (options: {
  modules?: unknown[];
  path?: string;
  state?: unknown;
  reducedMotion?: boolean;
} = {}) => {
  const {
    modules = [buildModule()],
    path = '/modulo-01/conclusao',
    state,
    reducedMotion = false,
  } = options;

  fetchMock.mockResolvedValue(jsonResponse({ modules }));

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: reducedMotion && query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }),
  });

  const store = createStore();
  store.set(sessionAtom, { status: 'anonymous', user: null });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[{ pathname: path, state }]}>
        <Routes>
          <Route path="/modulo-01/conclusao" element={<ModuleConclusion moduleSlug="modulo-01" />} />
          <Route path="/modulo-01" element={<p>trilha</p>} />
          <Route path="/" element={<p>início</p>} />
          <Route path="/modulo/modulo-02" element={<p>módulo 02</p>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
};

beforeEach(() => {
  setAccessToken(null);
  fetchMock.mockReset();
  (globalThis as { fetch?: unknown }).fetch = fetchMock;
  localStorage.clear();
});

describe('tela de conclusão de módulo', () => {
  it('dá os parabéns e anuncia estrelas, acertos e erros em região ao vivo', async () => {
    renderConclusion();

    expect(
      await screen.findByRole('heading', { name: 'PARABÉNS!' }),
    ).toBeInTheDocument();

    const announcement = screen.getByRole('status');
    await waitFor(() =>
      expect(announcement).toHaveTextContent(
        'Módulo concluído: 6 de 6 estrelas, 13 acertos e 3 erros em 2 de 2 atividades.',
      ),
    );
    expect(announcement).toHaveAttribute('aria-live', 'polite');
  });

  it('mostra o resumo de acertos, erros e atividades', async () => {
    renderConclusion();

    await waitFor(() =>
      expect(screen.getByText('ACERTOS').previousSibling?.textContent).toBe('13'),
    );

    expect(screen.getByText('ACERTOS').previousSibling?.textContent).toBe('13');
    expect(screen.getByText('ERROS').previousSibling?.textContent).toBe('3');
    expect(screen.getByText('ATIVIDADES').previousSibling?.textContent).toBe('2/2');
    expect(
      screen.getByRole('img', { name: '6 de 6 estrelas' }),
    ).toBeInTheDocument();
  });

  it('sempre oferece a volta à trilha, sem bloquear a criança', async () => {
    renderConclusion({ modules: [buildModule({ status: 'locked', isUnlocked: false })] });

    const trail = await screen.findByRole('link', { name: /VOLTAR À TRILHA/i });
    expect(trail).toHaveAttribute('href', '/modulo-01');
    expect(screen.getByRole('link', { name: 'Ir para o início' })).toHaveAttribute(
      'href',
      '/',
    );

    await userEvent.click(trail);
    expect(await screen.findByText('trilha')).toBeInTheDocument();
  });

  it('oferece o próximo módulo quando o servidor já o liberou', async () => {
    renderConclusion({
      modules: [
        buildModule(),
        buildModule({
          slug: 'modulo-02',
          title: 'Sons das letras',
          order: 2,
          status: 'current',
          isUnlocked: true,
          requiredCompleted: 0,
          stars: 0,
          activities: [],
        }),
      ],
    });

    const next = await screen.findByRole('link', { name: /PRÓXIMO MÓDULO/i });
    expect(next).toHaveAttribute('href', '/modulo/modulo-02');

    await userEvent.click(next);
    expect(await screen.findByText('módulo 02')).toBeInTheDocument();
  });

  it('não oferece o próximo módulo enquanto ele está bloqueado', async () => {
    renderConclusion({
      modules: [
        buildModule(),
        buildModule({
          slug: 'modulo-02',
          title: 'Sons das letras',
          order: 2,
          status: 'locked',
          isUnlocked: false,
          activities: [],
        }),
      ],
    });

    expect(
      await screen.findByText(/O próximo módulo abre quando este estiver completo/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /PRÓXIMO MÓDULO/i }),
    ).not.toBeInTheDocument();
  });

  it('libera o próximo módulo com o resultado que acabou de sair, mesmo antes da API', async () => {
    renderConclusion({
      modules: [
        buildModule({ requiredCompleted: 1, stars: 3 }),
        buildModule({
          slug: 'modulo-02',
          title: 'Sons das letras',
          order: 2,
          status: 'locked',
          isUnlocked: false,
          activities: [],
        }),
      ],
      state: {
        lastResult: {
          activitySlug: 'atividade-02',
          bestScore: 5,
          errors: 2,
          completed: true,
        },
      },
    });

    expect(
      await screen.findByRole('link', { name: /PRÓXIMO MÓDULO/i }),
    ).toBeInTheDocument();
  });

  it('anima a celebração só quando o sistema permite movimento', async () => {
    const { container, unmount } = renderConclusion();
    await waitFor(() =>
      expect(container.querySelector('.celebration')).not.toBeNull(),
    );
    expect(container.querySelector('.celebration--animated')).not.toBeNull();
    unmount();

    const reduced = renderConclusion({ reducedMotion: true });
    await waitFor(() =>
      expect(reduced.container.querySelector('.celebration')).not.toBeNull(),
    );
    expect(
      reduced.container.querySelector('.celebration--animated'),
    ).toBeNull();
  });

  it('não dá os parabéns quando o módulo ainda está pela metade', async () => {
    const halfDone = buildModule({ status: 'current', requiredCompleted: 1, stars: 3 });
    renderConclusion({
      modules: [
        {
          ...halfDone,
          activities: [
            halfDone.activities[0],
            { ...halfDone.activities[1], progress: null },
          ],
        },
      ],
    });

    expect(
      await screen.findByRole('heading', { name: 'AINDA FALTA POUCO!' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('Faltam 1 atividade para fechar o módulo.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'PARABÉNS!' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /PRÓXIMO MÓDULO/i })).not.toBeInTheDocument();
  });

  it('resume o módulo pelo progresso local quando a API não responde', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    localStorage.setItem(
      'dialo:guest-progress:v1',
      JSON.stringify([
        {
          activitySlug: 'atividade-01',
          bestScore: 8,
          attempts: 9,
          errors: 1,
          completed: true,
        },
      ]),
    );

    const store = createStore();
    store.set(sessionAtom, { status: 'anonymous', user: null });

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/modulo-01/conclusao']}>
          <ModuleConclusion moduleSlug="modulo-01" />
        </MemoryRouter>
      </Provider>,
    );

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        /Resumo do módulo: 2 de 15 estrelas, 8 acertos e 1 erros em 1 de 5 atividades\./,
      ),
    );
  });
});
