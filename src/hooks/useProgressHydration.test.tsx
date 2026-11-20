import { renderHook } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import type { ReactNode } from 'react';
import { useProgressHydration } from './useProgressHydration';
import { saveGuestProgress } from '../state/guestProgress';
import { progressAtom, reportProgressAtom } from '../state/progress';

beforeEach(() => {
  localStorage.clear();
});

describe('useProgressHydration', () => {
  it('devolve o progresso do aparelho ao átomo ao recarregar o jogo', () => {
    // O jogo recarregou: o átomo nasce vazio e o storage tem a tentativa.
    saveGuestProgress({
      activitySlug: 'atividade-01',
      bestScore: 8,
      attempts: 9,
      errors: 0,
      completed: true,
    });

    const store = createStore();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    renderHook(() => useProgressHydration(), { wrapper });

    expect(store.get(progressAtom)['atividade-01']).toMatchObject({
      bestScore: 8,
      completed: true,
    });
  });

  it('traz a tentativa feita antes da hidratação, sem perdê-la', () => {
    // A criança terminou uma atividade antes de a hidratação rodar. A escrita
    // já foi para o storage, então a leitura seguinte a encontra.
    createStore().set(reportProgressAtom, {
      activitySlug: 'atividade-02',
      report: { bestScore: 5, attempts: 5, errors: 1, completed: true },
      sync: false,
    });

    // Store novo simula o recarregamento da página.
    const reloaded = createStore();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <Provider store={reloaded}>{children}</Provider>
    );

    renderHook(() => useProgressHydration(), { wrapper });

    expect(reloaded.get(progressAtom)['atividade-02']).toMatchObject({ bestScore: 5 });
  });
});
