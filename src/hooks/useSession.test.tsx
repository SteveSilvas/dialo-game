import { act, renderHook, waitFor } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import type { ReactNode } from 'react';
import { useSession } from './useSession';
import { sessionAtom } from '../state/session';
import { setAccessToken } from '../api/client';
import type { User } from '../api/types';

const importProgress = jest.fn();
jest.mock('../api/catalog', () => ({
  importProgress: (...args: unknown[]) => importProgress(...args),
}));

jest.mock('../api/client', () => ({
  setAccessToken: jest.fn(),
  refreshSession: jest.fn(),
}));

jest.mock('../api/auth', () => ({ logout: jest.fn() }));

const STORAGE_KEY = 'dialo:guest-progress:v1';
const user: User = {
  id: '1',
  username: 'bia',
  email: null,
  displayName: 'Bia',
  avatarUrl: null,
  role: 'student',
  createdAt: '2026-01-01T00:00:00Z',
};

const renderSession = () => {
  const store = createStore();
  store.set(sessionAtom, { status: 'anonymous', user: null });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  return { store, ...renderHook(() => useSession(), { wrapper }) };
};

const guestEntry = {
  activitySlug: 'atividade-01',
  bestScore: 5,
  attempts: 5,
  errors: 0,
  completed: true,
};

beforeEach(() => {
  importProgress.mockReset();
  importProgress.mockResolvedValue({ imported: 1 });
  setAccessToken(null);
  localStorage.clear();
});

describe('useSession', () => {
  it('importa o progresso de convidado e limpa o armazenamento local', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([guestEntry]));
    const { result, store } = renderSession();

    await act(async () => {
      await result.current.signIn(user);
    });

    expect(importProgress).toHaveBeenCalledWith([guestEntry]);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(store.get(sessionAtom)).toEqual({ status: 'authenticated', user });
  });

  it('autentica só depois da importação, para o catálogo já vir com o progresso', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([guestEntry]));

    let releaseImport: (value: unknown) => void = () => undefined;
    importProgress.mockReturnValue(
      new Promise((resolve) => {
        releaseImport = resolve;
      }),
    );

    const { result, store } = renderSession();
    let signInDone = false;

    act(() => {
      void result.current.signIn(user).then(() => {
        signInDone = true;
      });
    });

    // A importação ainda está em voo: a sessão precisa continuar anônima,
    // senão o catálogo seria buscado antes do progresso chegar ao servidor.
    await waitFor(() => expect(importProgress).toHaveBeenCalled());
    expect(store.get(sessionAtom).status).toBe('anonymous');
    expect(signInDone).toBe(false);

    await act(async () => {
      releaseImport({ imported: 1 });
    });

    await waitFor(() => expect(signInDone).toBe(true));
    expect(store.get(sessionAtom)).toEqual({ status: 'authenticated', user });
  });

  it('mantém o progresso local quando a importação falha', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([guestEntry]));
    importProgress.mockRejectedValue(new Error('offline'));

    const { result, store } = renderSession();

    await act(async () => {
      await result.current.signIn(user);
    });

    // A criança entra mesmo assim; o progresso local fica para a próxima vez.
    expect(store.get(sessionAtom).status).toBe('authenticated');
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
  });

  it('não chama a importação quando não há progresso de convidado', async () => {
    const { result } = renderSession();

    await act(async () => {
      await result.current.signIn(user);
    });

    expect(importProgress).not.toHaveBeenCalled();
  });
});
