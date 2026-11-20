import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider, createStore } from 'jotai';
import Atividade05 from '../atividade_05';
import ModuleConclusion from '../../modulo/conclusao';
import ModuleHome from '../../modulo';
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
        bestScore: 8,
        attempts: 8,
        errors: 0,
        stars: 3,
        completedAt: '2026-01-01T00:00:00+00:00',
      }
    : null,
});

/** Módulo 01 com todas as atividades feitas menos a última (atividade-05). */
const moduleWithLastActivityPending = () => ({
  slug: 'modulo-01',
  title: 'Reconhecer símbolos',
  description: 'Distinguir símbolos.',
  concept: 'letras',
  order: 1,
  status: 'current',
  isUnlocked: true,
  requiredTotal: 5,
  requiredCompleted: 4,
  stars: 12,
  maxStars: 15,
  activities: [
    activity('atividade-01', 1, true),
    activity('atividade-02', 2, true),
    activity('atividade-03', 3, true),
    activity('atividade-04', 4, true),
    activity('atividade-05', 5, false),
  ],
});

const moduleTwo = {
  slug: 'modulo-02',
  title: 'Sons das letras',
  description: 'Consciência fonológica.',
  concept: 'sons',
  order: 2,
  status: 'locked',
  isUnlocked: false,
  requiredTotal: 3,
  requiredCompleted: 0,
  stars: 0,
  maxStars: 9,
  activities: [],
};

/**
 * Catálogo do servidor: a primeira leitura ainda não tem a atividade-05 (o PUT
 * acabou de sair), a seguinte já a traz concluída e o módulo 02 liberado.
 */
const stubCatalog = () => {
  const afterFinish = {
    ...moduleWithLastActivityPending(),
    status: 'completed',
    requiredCompleted: 5,
    stars: 15,
    activities: moduleWithLastActivityPending().activities.map((item) =>
      item.slug === 'atividade-05' ? activity('atividade-05', 5, true) : item,
    ),
  };

  fetchMock.mockImplementation((url: string) => {
    if (url.includes('/progress/activities/')) {
      return Promise.resolve(jsonResponse({ activitySlug: 'atividade-05' }));
    }
    return Promise.resolve(
      jsonResponse({
        modules: [afterFinish, { ...moduleTwo, status: 'current', isUnlocked: true }],
      }),
    );
  });
};

const renderFlow = () => {
  const store = createStore();
  store.set(sessionAtom, { status: 'anonymous', user: null });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/modulo-01/atividade-05']}>
        <Routes>
          <Route path="/modulo-01/atividade-05" element={<Atividade05 />} />
          <Route
            path="/modulo-01/conclusao"
            element={<ModuleConclusion moduleSlug="modulo-01" />}
          />
          <Route path="/modulo-01" element={<ModuleHome moduleSlug="modulo-01" />} />
          <Route path="/modulo/:moduleSlug" element={<ModuleHome />} />
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

afterEach(() => {
  jest.useRealTimers();
});

describe('fluxo até a conclusão do módulo', () => {
  it('leva da última atividade à conclusão e ao próximo módulo', async () => {
    stubCatalog();
    renderFlow();

    // A criança acerta o último item que falta: só as consoantes sobram na
    // grade, então basta clicar em todas as letras que não são vogais.
    const consoantes = screen
      .getAllByRole('button')
      .filter((botao) => /^[B-DF-HJ-NP-TV-Z]$/.test(botao.textContent ?? ''));

    expect(consoantes.length).toBeGreaterThan(0);

    jest.useFakeTimers();

    for (const consoante of consoantes) {
      fireEvent.click(consoante);
    }

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // A API confirma o progresso e o módulo fecha: o botão de conclusão aparece.
    const concluir = await screen.findByRole('link', { name: /CONCLUIR MÓDULO/i });
    expect(concluir).toHaveAttribute('href', '/modulo-01/conclusao');

    jest.useRealTimers();

    fireEvent.click(concluir);

    expect(
      await screen.findByRole('heading', { name: 'PARABÉNS!' }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(/Módulo concluído:/),
    );

    const proximo = await screen.findByRole('link', { name: /PRÓXIMO MÓDULO/i });
    expect(proximo).toHaveAttribute('href', '/modulo/modulo-02');

    fireEvent.click(proximo);

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'SONS DAS LETRAS' }),
      ).toBeInTheDocument(),
    );
  });

  it('não fecha o módulo quando ainda falta outra atividade', async () => {
    const pending = moduleWithLastActivityPending();
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/progress/activities/')) {
        return Promise.resolve(jsonResponse({ activitySlug: 'atividade-05' }));
      }
      return Promise.resolve(
        jsonResponse({
          modules: [
            {
              ...pending,
              requiredCompleted: 3,
              // A criança pulou a atividade 03: mesmo com a 05 concluída, o
              // módulo ainda não fecha.
              activities: pending.activities.map((item) =>
                item.slug === 'atividade-05'
                  ? activity('atividade-05', 5, true)
                  : item.slug === 'atividade-03'
                    ? activity('atividade-03', 3, false)
                    : item,
              ),
            },
          ],
        }),
      );
    });

    renderFlow();

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
    jest.useRealTimers();

    // Ainda faltam atividades: a criança volta à trilha, como antes.
    const proxima = await screen.findByRole('link', { name: /PRÓXIMA/i });
    expect(proxima).toHaveAttribute('href', '/modulo-01');
    expect(
      screen.queryByRole('link', { name: /CONCLUIR MÓDULO/i }),
    ).not.toBeInTheDocument();
  });
});
