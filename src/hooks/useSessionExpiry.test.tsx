import { act, renderHook } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import type { ReactNode } from 'react';
import { useSessionExpiry } from './useSession';
import { sessionAtom } from '../state/session';
import { SESSION_EXPIRED_EVENT } from '../api/client';
import type { User } from '../api/types';

const user: User = {
  id: '1',
  username: 'bia',
  email: null,
  displayName: 'Bia',
  avatarUrl: null,
  role: 'student',
  createdAt: '2026-01-01T00:00:00Z',
};

const renderExpiry = (authenticated: boolean) => {
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

  return { store, ...renderHook(() => useSessionExpiry(), { wrapper }) };
};

describe('expiração de sessão', () => {
  it('rebaixa a sessão autenticada para visitante', () => {
    const { store } = renderExpiry(true);

    act(() => {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    });

    expect(store.get(sessionAtom)).toEqual({ status: 'anonymous', user: null });
  });

  it('não faz nada quando a sessão já é de visitante', () => {
    const { store } = renderExpiry(false);

    act(() => {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    });

    expect(store.get(sessionAtom)).toEqual({ status: 'anonymous', user: null });
  });

  it('para de escutar depois de desmontar', () => {
    const { store, unmount } = renderExpiry(true);

    unmount();

    act(() => {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    });

    expect(store.get(sessionAtom).status).toBe('authenticated');
  });
});
