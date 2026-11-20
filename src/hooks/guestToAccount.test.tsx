import { act, renderHook, waitFor } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import type { ReactNode } from 'react';
import { useCatalog } from './useCatalog';
import { useProgressReporter } from './useProgressReporter';
import { useProgressSync } from './useProgressSync';
import { useSession } from './useSession';
import { sessionAtom } from '../state/session';
import { readGuestProgress } from '../state/guestProgress';
import { progressAtom, progressQueueAtom, syncStatusAtom } from '../state/progress';
import { setAccessToken } from '../api/client';
import type { User } from '../api/types';

const fetchMock = jest.fn();
const jsonResponse = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => JSON.stringify(body),
});

jest.mock('../api/client', () => ({
  ...jest.requireActual('../api/client'),
  refreshSession: jest.fn(),
}));

const user: User = {
  id: '1',
  username: 'bia',
  email: null,
  displayName: 'Bia',
  avatarUrl: null,
  role: 'student',
  createdAt: '2026-01-01T00:00:00Z',
};

const modulePayload = {
  slug: 'modulo-01',
  title: 'Reconhecer letras',
  description: 'Vamos aprender?',
  concept: 'letras',
  order: 1,
  status: 'current',
  isUnlocked: true,
  requiredTotal: 1,
  requiredCompleted: 0,
  stars: 0,
  maxStars: 3,
  activities: [
    {
      slug: 'atividade-01',
      title: 'Letras',
      type: 'selectSymbols',
      order: 1,
      isRequired: true,
      configJson: '{}',
      progress: null,
    },
  ],
};

const report = { bestScore: 8, attempts: 9, errors: 0, completed: true };

const renderGame = (authenticated: boolean) => {
  const store = createStore();
  store.set(
    sessionAtom,
    authenticated
      ? { status: 'authenticated', user }
      : { status: 'anonymous', user: null },
  );

  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  return {
    store,
    ...renderHook(
      () => {
        // O `Layout` monta o mesmo conjunto de hooks; aqui ele é o jogo todo.
        useProgressSync();

        return {
          catalog: useCatalog(),
          report: useProgressReporter(),
          session: useSession(),
        };
      },
      { wrapper },
    ),
  };
};

/** Servidor que responde catálogo e gravação de progresso. */
const stubServer = (options: { authenticatedCatalog?: boolean } = {}) => {
  fetchMock.mockImplementation((url: string) => {
    if (url.includes('/progress/import')) {
      return Promise.resolve(jsonResponse({ imported: 1 }));
    }
    if (url.includes('/progress/activities/')) {
      return Promise.resolve(jsonResponse({ activitySlug: 'atividade-01' }));
    }
    return Promise.resolve(
      jsonResponse({
        modules: [
          options.authenticatedCatalog
            ? {
                ...modulePayload,
                requiredCompleted: 1,
                stars: 3,
                activities: [
                  {
                    ...modulePayload.activities[0],
                    progress: {
                      activitySlug: 'atividade-01',
                      bestScore: 8,
                      attempts: 9,
                      errors: 0,
                      stars: 3,
                      completedAt: '2026-01-01T00:00:00+00:00',
                    },
                  },
                ],
              }
            : modulePayload,
        ],
      }),
    );
  });
};

beforeEach(() => {
  setAccessToken(null);
  fetchMock.mockReset();
  (globalThis as { fetch?: unknown }).fetch = fetchMock;
  localStorage.clear();
});

describe('modo convidado até a conta', () => {
  it('a criança joga sem conta e vê as estrelas na trilha', async () => {
    stubServer();
    const { result } = renderGame(false);

    await waitFor(() => expect(result.current.catalog.status).toBe('ready'));

    act(() => {
      result.current.report('atividade-01', report);
    });

    await waitFor(() =>
      expect(
        result.current.catalog.modules[0]!.activities[0]!.progress?.stars,
      ).toBe(3),
    );
    expect(result.current.catalog.modules[0]!.requiredCompleted).toBe(1);

    // Sem conta, nada vai para o servidor: o progresso é do aparelho.
    expect(
      fetchMock.mock.calls.filter(([url]) => String(url).includes('/progress/')),
    ).toHaveLength(0);
    expect(readGuestProgress()).toHaveLength(1);
  });

  it('o adulto cria a conta e o progresso anterior aparece preservado', async () => {
    stubServer();
    const { result } = renderGame(false);

    await waitFor(() => expect(result.current.catalog.status).toBe('ready'));

    act(() => {
      result.current.report('atividade-01', report);
    });
    await waitFor(() => expect(readGuestProgress()).toHaveLength(1));

    stubServer({ authenticatedCatalog: true });
    setAccessToken('token');

    await act(async () => {
      await result.current.session.signIn(user);
    });

    // A importação levou o progresso local para a conta e limpou o aparelho.
    const importCall = fetchMock.mock.calls.find(([url]) =>
      String(url).includes('/progress/import'),
    );
    expect(importCall).toBeDefined();
    expect(readGuestProgress()).toEqual([]);

    await waitFor(() =>
      expect(
        result.current.catalog.modules[0]!.activities[0]!.progress?.stars,
      ).toBe(3),
    );
  });

  it('offline não perde a tentativa e ela sobe quando a rede volta', async () => {
    stubServer();
    const { result, store } = renderGame(true);

    await waitFor(() => expect(result.current.catalog.status).toBe('ready'));

    // A rede cai justamente na hora de registrar a atividade.
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    act(() => {
      result.current.report('atividade-01', report);
    });

    await waitFor(() => expect(store.get(syncStatusAtom)).toBe('offline'));

    // Nada foi perdido: a tentativa está no aparelho e na fila de envio.
    expect(readGuestProgress()).toHaveLength(1);
    expect(store.get(progressQueueAtom)).toHaveLength(1);
    expect(store.get(progressAtom)['atividade-01']).toMatchObject({ bestScore: 8 });

    stubServer();
    await act(async () => {
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => expect(store.get(progressQueueAtom)).toEqual([]));
    expect(readGuestProgress()).toEqual([]);
    expect(store.get(syncStatusAtom)).toBe('saved');
  });
});
