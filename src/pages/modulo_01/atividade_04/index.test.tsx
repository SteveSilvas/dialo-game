import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider, createStore } from 'jotai';
import Atividade04 from '../atividade_04';
import ModuleConclusion from '../../modulo/conclusao';
import { sessionAtom } from '../../../state/session';
import { setAccessToken } from '../../../api/client';

const fetchMock = jest.fn();
const jsonResponse = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => JSON.stringify(body),
});

const activity = (slug: string, order: number, completed: boolean) => ({
  slug,
  title: slug,
  type: 'selectSymbols',
  order,
  isRequired: true,
  configJson: '{}',
  progress: completed
    ? {
        activitySlug: slug,
        bestScore: 7,
        attempts: 7,
        errors: 0,
        stars: 3,
        completedAt: '2026-01-01T00:00:00+00:00',
      }
    : null,
});

const buildModule = (activities: ReturnType<typeof activity>[]) => ({
  slug: 'modulo-01',
  title: 'Reconhecer símbolos',
  description: 'Distinguir símbolos.',
  concept: 'letras',
  order: 1,
  status: 'current',
  isUnlocked: true,
  requiredTotal: activities.length,
  requiredCompleted: activities.filter((item) => item.progress).length,
  stars: activities.filter((item) => item.progress).length * 3,
  maxStars: activities.length * 3,
  activities,
});

/**
 * A criança escolhe a ordem das atividades: aqui ela deixa a 04 por último.
 * Ao terminar, o módulo fecha mesmo sem passar pela 05.
 */
const stubCatalog = () => {
  const done = buildModule([
    activity('atividade-01', 1, true),
    activity('atividade-02', 2, true),
    activity('atividade-03', 3, true),
    activity('atividade-04', 4, true),
    activity('atividade-05', 5, true),
  ]);

  fetchMock.mockImplementation((url: string) => {
    if (url.includes('/progress/activities/')) {
      return Promise.resolve(jsonResponse({ activitySlug: 'atividade-04' }));
    }
    return Promise.resolve(jsonResponse({ modules: [done] }));
  });
};

beforeEach(() => {
  setAccessToken(null);
  fetchMock.mockReset();
  (globalThis as { fetch?: unknown }).fetch = fetchMock;
  localStorage.clear();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('atividade comum fechando o módulo', () => {
  it('oferece a conclusão quando a atividade escolhida por último fecha o módulo', async () => {
    stubCatalog();

    const store = createStore();
    store.set(sessionAtom, { status: 'anonymous', user: null });

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/modulo-01/atividade-04']}>
          <Routes>
            <Route path="/modulo-01/atividade-04" element={<Atividade04 />} />
            <Route
              path="/modulo-01/conclusao"
              element={<ModuleConclusion moduleSlug="modulo-01" />}
            />
          </Routes>
        </MemoryRouter>
      </Provider>,
    );

    // Só as consoantes contam como acerto nesta atividade.
    const consoantes = screen
      .getAllByRole('button')
      .filter((botao) => /^[B-DF-HJ-NP-TV-Z]$/.test(botao.textContent ?? ''));

    jest.useFakeTimers();
    for (const consoante of consoantes) {
      fireEvent.click(consoante);
    }
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    const concluir = await screen.findByRole('link', { name: /CONCLUIR MÓDULO/i });
    jest.useRealTimers();

    fireEvent.click(concluir);

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'PARABÉNS!' }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByRole('status')).toHaveTextContent(/Módulo concluído/);
  });
});
