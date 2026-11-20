import { act, render, screen } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import type { ReactNode } from 'react';
import SyncIndicator from './index';
import { sessionAtom } from '../../state/session';
import { syncStatusAtom } from '../../state/progress';
import type { ProgressSyncStatus } from '../../state/progress';
import type { User } from '../../api/types';

const user: User = {
  id: '1',
  username: 'bia',
  email: null,
  displayName: 'Bia',
  avatarUrl: null,
  role: 'student',
  createdAt: '2026-01-01T00:00:00Z',
};

const renderIndicator = (authenticated: boolean, status: ProgressSyncStatus) => {
  const store = createStore();
  store.set(
    sessionAtom,
    authenticated
      ? { status: 'authenticated', user }
      : { status: 'anonymous', user: null },
  );
  store.set(syncStatusAtom, status);

  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  return render(wrapper({ children: <SyncIndicator /> }));
};

describe('indicador de sincronização', () => {
  it('avisa que está salvando e depois que salvou', () => {
    const { unmount } = renderIndicator(true, 'saving');
    expect(screen.getByRole('status')).toHaveTextContent('Salvando...');
    unmount();

    renderIndicator(true, 'saved');
    expect(screen.getByRole('status')).toHaveTextContent('Salvo');
  });

  it('não aparece antes de a criança salvar nada', () => {
    const { container } = renderIndicator(true, 'idle');
    expect(container).toBeEmptyDOMElement();
  });

  it('não aparece para quem joga sem conta', () => {
    // O progresso do convidado fica no aparelho: não há o que sincronizar.
    const { container } = renderIndicator(false, 'saving');
    expect(container).toBeEmptyDOMElement();
  });

  it('explica que a tentativa ficou no aparelho quando a rede falha', () => {
    renderIndicator(true, 'offline');
    expect(screen.getByRole('status')).toHaveTextContent(/Salvo neste aparelho/i);
  });

  it('some sozinho depois de confirmar, para não virar um selo na tela', () => {
    jest.useFakeTimers();
    renderIndicator(true, 'saved');
    expect(screen.getByRole('status')).toHaveTextContent('Salvo');

    act(() => {
      jest.advanceTimersByTime(3_000);
    });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  it('anuncia a mudança sem interromper o leitor de tela', () => {
    renderIndicator(true, 'saving');
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });
});
