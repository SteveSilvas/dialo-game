import { renderHook, waitFor } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import type { ReactNode } from 'react';
import { useModuleCompletion } from './useModuleCompletion';
import { saveGuestProgress } from '../state/guestProgress';
import { setAccessToken } from '../api/client';

const fetchMock = jest.fn();
const jsonResponse = (body: unknown) => ({
  ok: true,
  status: 200,
  text: async () => JSON.stringify(body),
});

const activity = (slug: string, completed: boolean) => ({
  slug,
  title: slug,
  type: 'selectSymbols',
  order: 1,
  isRequired: true,
  configJson: '{}',
  progress: completed
    ? {
        activitySlug: slug,
        bestScore: 8,
        attempts: 1,
        errors: 0,
        stars: 3,
        completedAt: '2026-01-01T00:00:00+00:00',
      }
    : null,
});

const modulePayload = (firstCompleted: boolean) => ({
  slug: 'modulo-01',
  title: 'Reconhecer símbolos',
  description: 'd',
  concept: 'c',
  order: 1,
  status: 'current',
  isUnlocked: true,
  requiredTotal: 2,
  requiredCompleted: firstCompleted ? 1 : 0,
  stars: firstCompleted ? 3 : 0,
  maxStars: 6,
  activities: [activity('atividade-01', firstCompleted), activity('atividade-02', false)],
});

const result = {
  activitySlug: 'atividade-02',
  bestScore: 8,
  errors: 0,
  completed: true,
};

/** Store próprio por teste: o padrão é compartilhado entre arquivos. */
const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={createStore()}>{children}</Provider>
);

beforeEach(() => {
  setAccessToken(null);
  fetchMock.mockReset();
  (globalThis as { fetch?: unknown }).fetch = fetchMock;
  localStorage.clear();
});

describe('useModuleCompletion', () => {
  it('fecha o módulo quando o progresso do convidado está só no localStorage', async () => {
    // O servidor não guarda progresso de convidado: devolve tudo zerado. Sem o
    // merge local a checagem nunca fecharia o módulo para quem joga sem conta.
    fetchMock.mockResolvedValue(jsonResponse({ modules: [modulePayload(false)] }));
    saveGuestProgress({
      activitySlug: 'atividade-01',
      bestScore: 8,
      attempts: 1,
      errors: 0,
      completed: true,
    });

    const { result: hook } = renderHook(() => useModuleCompletion('modulo-01', result), { wrapper });

    await waitFor(() => expect(hook.current.ready).toBe(true));
    expect(hook.current.complete).toBe(true);
  });

  it('não fecha o módulo quando ainda falta uma atividade', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ modules: [modulePayload(false)] }));

    const { result: hook } = renderHook(() => useModuleCompletion('modulo-01', result), { wrapper });

    await waitFor(() => expect(hook.current.ready).toBe(true));
    expect(hook.current.complete).toBe(false);
  });

  it('cai no progresso local quando a API está fora', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    // Sem API, a trilha local define as cinco atividades do módulo.
    for (const slug of ['atividade-01', 'atividade-02', 'atividade-03', 'atividade-04']) {
      saveGuestProgress({
        activitySlug: slug,
        bestScore: 8,
        attempts: 1,
        errors: 0,
        completed: true,
      });
    }

    const { result: hook } = renderHook(() =>
      useModuleCompletion('modulo-01', {
        activitySlug: 'atividade-05',
        bestScore: 8,
        errors: 0,
        completed: true,
      }),
      { wrapper },
    );

    await waitFor(() => expect(hook.current.ready).toBe(true));
    expect(hook.current.complete).toBe(true);
  });
});
