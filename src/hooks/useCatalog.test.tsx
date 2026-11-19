import { renderHook, waitFor, act } from '@testing-library/react';
import { Provider } from 'jotai';
import type { ReactNode } from 'react';
import { useCatalog, useProgressReporter } from './useCatalog';
import { sessionAtom } from '../state/session';
import { saveGuestProgress } from '../state/guestProgress';
import { setAccessToken } from '../api/client';
import { createStore } from 'jotai';

const fetchMock = jest.fn();
const jsonResponse = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => JSON.stringify(body),
});

const modulePayload = {
  slug: 'modulo-01',
  title: 'Reconhecer letras',
  description: 'Vamos aprender?',
  concept: 'letras',
  order: 1,
  status: 'current',
  isUnlocked: true,
  requiredTotal: 2,
  requiredCompleted: 0,
  stars: 0,
  maxStars: 6,
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
    {
      slug: 'atividade-02',
      title: 'Números',
      type: 'selectSymbols',
      order: 2,
      isRequired: true,
      configJson: '{}',
      progress: null,
    },
  ],
};

const authenticatedUser = {
  id: '1',
  username: 'bia',
  email: null,
  displayName: null,
  avatarUrl: null,
  role: 'student' as const,
  createdAt: '2026-01-01T00:00:00+00:00',
};

/** Monta o hook com uma sessão já resolvida, evitando o refresh inicial. */
const setup = (authenticated: boolean) => {
  const store = createStore();
  store.set(
    sessionAtom,
    authenticated
      ? { status: 'authenticated', user: authenticatedUser }
      : { status: 'anonymous', user: null },
  );

  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  return { store, wrapper };
};

beforeEach(() => {
  setAccessToken(null);
  fetchMock.mockReset();
  (globalThis as { fetch?: unknown }).fetch = fetchMock;
  localStorage.clear();
});

describe('useCatalog', () => {
  it('expõe os módulos da API quando autenticado', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ modules: [modulePayload] }));
    const { wrapper } = setup(true);

    const { result } = renderHook(() => useCatalog(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.modules[0].slug).toBe('modulo-01');
  });

  it('aplica o progresso local do convidado sobre a trilha', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ modules: [modulePayload] }));
    saveGuestProgress({
      activitySlug: 'atividade-01',
      bestScore: 4,
      attempts: 5,
      errors: 0,
      completed: true,
    });
    const { wrapper } = setup(false);

    const { result } = renderHook(() => useCatalog(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe('ready'));

    const activity = result.current.modules[0].activities[0];
    expect(activity.progress?.stars).toBe(3);
    expect(result.current.modules[0].requiredCompleted).toBe(1);
    expect(result.current.modules[0].stars).toBe(3);
  });

  it('marca offline quando a API não responde e não quebra a tela', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const { wrapper } = setup(false);

    const { result } = renderHook(() => useCatalog(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe('offline'));
    expect(result.current.modules).toEqual([]);
  });
});

describe('useProgressReporter', () => {
  it('grava localmente quando não há conta', async () => {
    const { wrapper } = setup(false);

    const { result } = renderHook(() => useProgressReporter(), { wrapper });

    await act(async () => {
      await result.current('atividade-01', {
        bestScore: 5,
        attempts: 6,
        errors: 1,
        completed: true,
      });
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(localStorage.getItem('dialo:guest-progress:v1')).toContain('atividade-01');
  });

  it('envia para a API quando há conta', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ activitySlug: 'atividade-01' }));
    setAccessToken('token');
    const { wrapper } = setup(true);

    const { result } = renderHook(() => useProgressReporter(), { wrapper });

    await act(async () => {
      await result.current('atividade-01', {
        bestScore: 5,
        attempts: 6,
        errors: 1,
        completed: true,
      });
    });

    expect(fetchMock.mock.calls[0][0]).toContain('/progress/activities/atividade-01');
    expect(localStorage.getItem('dialo:guest-progress:v1')).toBeNull();
  });

  it('guarda localmente quando a API cai, para não perder a tentativa', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    setAccessToken('token');
    const { wrapper } = setup(true);

    const { result } = renderHook(() => useProgressReporter(), { wrapper });

    await act(async () => {
      await result.current('atividade-01', {
        bestScore: 5,
        attempts: 6,
        errors: 1,
        completed: true,
      });
    });

    expect(localStorage.getItem('dialo:guest-progress:v1')).toContain('atividade-01');
  });

  it('não insiste quando o servidor recusa (módulo bloqueado)', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ detail: 'Módulo bloqueado' }, 403));
    setAccessToken('token');
    const { wrapper } = setup(true);

    const { result } = renderHook(() => useProgressReporter(), { wrapper });

    await act(async () => {
      await result.current('atividade-01', {
        bestScore: 5,
        attempts: 6,
        errors: 1,
        completed: true,
      });
    });

    expect(localStorage.getItem('dialo:guest-progress:v1')).toBeNull();
  });
});
