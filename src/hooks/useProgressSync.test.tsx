import { act, renderHook, waitFor } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import type { ReactNode } from 'react';
import { useProgressSync } from './useProgressSync';
import { sessionAtom } from '../state/session';
import {
  progressAtom,
  progressQueueAtom,
  reportProgressAtom,
  syncStatusAtom,
} from '../state/progress';
import { readGuestProgress } from '../state/guestProgress';
import { setAccessToken } from '../api/client';
import type { User } from '../api/types';

const fetchMock = jest.fn();
const jsonResponse = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => JSON.stringify(body),
});

const user: User = {
  id: '1',
  username: 'bia',
  email: null,
  displayName: 'Bia',
  avatarUrl: null,
  role: 'student',
  createdAt: '2026-01-01T00:00:00Z',
};

const report = { bestScore: 6, attempts: 7, errors: 1, completed: true };

const setup = (authenticated: boolean) => {
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

  return { store, wrapper };
};

beforeEach(() => {
  setAccessToken('token');
  fetchMock.mockReset();
  (globalThis as { fetch?: unknown }).fetch = fetchMock;
  localStorage.clear();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useProgressSync', () => {
  it('sobe a fila em segundo plano quando há conta', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ activitySlug: 'atividade-01' }));
    const { store, wrapper } = setup(true);

    store.set(reportProgressAtom, {
      activitySlug: 'atividade-01',
      report,
      sync: true,
    });

    renderHook(() => useProgressSync(), { wrapper });

    await waitFor(() => expect(store.get(progressQueueAtom)).toEqual([]));
    expect(store.get(syncStatusAtom)).toBe('saved');
  });

  it('não tenta enviar para quem joga sem conta', async () => {
    const { store, wrapper } = setup(false);

    store.set(reportProgressAtom, {
      activitySlug: 'atividade-01',
      report,
      sync: false,
    });

    renderHook(() => useProgressSync(), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    expect(fetchMock).not.toHaveBeenCalled();
    // A fila é o próprio progresso de quem joga como convidado.
    expect(store.get(progressAtom)['atividade-01']).toMatchObject({ bestScore: 6 });
  });

  it('tenta de novo sozinho depois de uma falha de rede, sem perder dados', async () => {
    jest.useFakeTimers();

    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const { store, wrapper } = setup(true);

    store.set(reportProgressAtom, {
      activitySlug: 'atividade-01',
      report,
      sync: true,
    });

    renderHook(() => useProgressSync(), { wrapper });

    // Primeira rodada falha: o progresso continua no aparelho.
    await waitFor(() => expect(store.get(syncStatusAtom)).toBe('offline'));
    expect(readGuestProgress()).toHaveLength(1);

    fetchMock.mockResolvedValue(jsonResponse({ activitySlug: 'atividade-01' }));

    // O retry é agendado com espera crescente; avança o relógio até ele sair.
    await act(async () => {
      jest.advanceTimersByTime(5_000);
      await Promise.resolve();
    });

    await waitFor(() => expect(store.get(progressQueueAtom)).toEqual([]));
    expect(store.get(syncStatusAtom)).toBe('saved');
    expect(readGuestProgress()).toEqual([]);
  });

  it('reenvia quando o navegador avisa que a rede voltou', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const { store, wrapper } = setup(true);

    store.set(reportProgressAtom, {
      activitySlug: 'atividade-01',
      report,
      sync: true,
    });

    renderHook(() => useProgressSync(), { wrapper });

    await waitFor(() => expect(store.get(syncStatusAtom)).toBe('offline'));

    fetchMock.mockResolvedValue(jsonResponse({ activitySlug: 'atividade-01' }));

    await act(async () => {
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => expect(store.get(progressQueueAtom)).toEqual([]));
    expect(store.get(syncStatusAtom)).toBe('saved');
  });
});
