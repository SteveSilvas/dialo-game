import { createStore } from 'jotai';
import {
  flushProgressAtom,
  importGuestProgressAtom,
  pendingAtom,
  progressAtom,
  progressQueueAtom,
  reportProgressAtom,
  syncStatusAtom,
} from './progress';
import { readGuestProgress, saveGuestProgress } from './guestProgress';
import { setAccessToken } from '../api/client';

const fetchMock = jest.fn();
const jsonResponse = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => JSON.stringify(body),
});

const report = {
  bestScore: 6,
  attempts: 7,
  errors: 1,
  completed: true,
};

const store = () => {
  const created = createStore();
  return created;
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

describe('átomos de progresso', () => {
  it('grava de forma otimista, antes de qualquer resposta do servidor', () => {
    const atomStore = store();

    atomStore.set(reportProgressAtom, {
      activitySlug: 'atividade-01',
      report,
      sync: false,
    });

    // O progresso vale no aparelho na hora, mesmo sem rede envolvida.
    expect(atomStore.get(progressAtom)['atividade-01']).toMatchObject({
      bestScore: 6,
      errors: 1,
      completed: true,
    });
    expect(atomStore.get(syncStatusAtom)).toBe('local');
  });

  it('nunca piora o registro guardado ao repetir a atividade', () => {
    const atomStore = store();
    const report_ = (bestScore: number, errors: number) =>
      atomStore.set(reportProgressAtom, {
        activitySlug: 'atividade-01',
        report: { bestScore, attempts: 1, errors, completed: true },
        sync: false,
      });

    report_(6, 0);
    report_(2, 5);

    expect(atomStore.get(progressAtom)['atividade-01']).toMatchObject({
      bestScore: 6,
      errors: 0,
    });
  });

  it('sobe a fila e limpa o que o servidor confirmou', async () => {
    const atomStore = store();
    fetchMock.mockResolvedValue(jsonResponse({ activitySlug: 'atividade-01' }));

    atomStore.set(reportProgressAtom, {
      activitySlug: 'atividade-01',
      report,
      sync: true,
    });
    expect(atomStore.get(progressQueueAtom)).toHaveLength(1);

    await atomStore.set(flushProgressAtom, undefined as never);

    expect(fetchMock.mock.calls[0]![0]).toContain('/progress/activities/atividade-01');
    expect(atomStore.get(progressQueueAtom)).toEqual([]);
    expect(atomStore.get(syncStatusAtom)).toBe('saved');
    expect(localStorage.getItem('dialo:guest-progress:v1')).toBeNull();
  });

  it('continua mostrando o que o servidor confirmou, sem piscar zero estrela', async () => {
    const atomStore = store();
    fetchMock.mockResolvedValue(jsonResponse({ activitySlug: 'atividade-01' }));

    atomStore.set(reportProgressAtom, {
      activitySlug: 'atividade-01',
      report,
      sync: true,
    });

    await atomStore.set(flushProgressAtom, undefined as never);

    // Saiu da fila (nada mais a enviar), mas o catálogo em mãos ainda é o de
    // antes do PUT: a trilha precisa continuar contando esta atividade.
    expect(atomStore.get(pendingAtom)).toEqual({});
    expect(atomStore.get(progressAtom)['atividade-01']).toMatchObject({ bestScore: 6 });
  });

  it('mantém a tentativa no aparelho quando a rede falha', async () => {
    const atomStore = store();
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    atomStore.set(reportProgressAtom, {
      activitySlug: 'atividade-01',
      report,
      sync: true,
    });

    await atomStore.set(flushProgressAtom, undefined as never);

    expect(atomStore.get(syncStatusAtom)).toBe('offline');
    expect(atomStore.get(progressQueueAtom)).toHaveLength(1);
    expect(readGuestProgress()).toHaveLength(1);
  });

  it('não perde a tentativa e a envia quando a rede volta', async () => {
    const atomStore = store();
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    atomStore.set(reportProgressAtom, {
      activitySlug: 'atividade-01',
      report,
      sync: true,
    });

    await atomStore.set(flushProgressAtom, undefined as never);
    expect(atomStore.get(syncStatusAtom)).toBe('offline');

    fetchMock.mockResolvedValue(jsonResponse({ activitySlug: 'atividade-01' }));
    await atomStore.set(flushProgressAtom, undefined as never);

    expect(atomStore.get(syncStatusAtom)).toBe('saved');
    expect(atomStore.get(progressQueueAtom)).toEqual([]);
    expect(readGuestProgress()).toEqual([]);
  });

  it('descarta da fila o que o servidor recusa, sem ficar tentando', async () => {
    const atomStore = store();
    fetchMock.mockResolvedValue(jsonResponse({ detail: 'Módulo bloqueado' }, 403));

    atomStore.set(reportProgressAtom, {
      activitySlug: 'atividade-02',
      report,
      sync: true,
    });

    await atomStore.set(flushProgressAtom, undefined as never);

    // 403 não volta: o catálogo do servidor é que manda.
    expect(atomStore.get(progressQueueAtom)).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('não deixa o envio em andamento engolir uma tentativa nova', async () => {
    const atomStore = store();

    let release: (value: unknown) => void = () => undefined;
    fetchMock.mockReturnValueOnce(
      new Promise((resolve) => {
        release = resolve;
      }),
    );

    atomStore.set(reportProgressAtom, {
      activitySlug: 'atividade-01',
      report: { bestScore: 3, attempts: 3, errors: 0, completed: true },
      sync: true,
    });

    const flushing = atomStore.set(flushProgressAtom, undefined as never);

    // A criança repete a atividade enquanto o primeiro envio está em voo.
    atomStore.set(reportProgressAtom, {
      activitySlug: 'atividade-01',
      report: { bestScore: 9, attempts: 2, errors: 0, completed: true },
      sync: true,
    });

    fetchMock.mockResolvedValue(jsonResponse({ activitySlug: 'atividade-01' }));
    release(jsonResponse({ activitySlug: 'atividade-01' }));
    await flushing;

    // O registro melhor precisa subir também: nada pode ficar só no aparelho.
    expect(fetchMock.mock.calls.at(-1)![0]).toContain('/progress/activities/atividade-01');
    expect(atomStore.get(progressQueueAtom)).toEqual([]);
    expect(readGuestProgress()).toEqual([]);
  });

  it('importa o progresso do convidado para a conta e limpa o aparelho', async () => {
    const atomStore = store();
    fetchMock.mockResolvedValue(jsonResponse({ imported: 1 }));

    saveGuestProgress({ activitySlug: 'atividade-01', ...report });
    // O login pode acontecer antes da hidratação: a importação lê o storage.
    expect(atomStore.get(progressAtom)).toEqual({});

    await atomStore.set(importGuestProgressAtom, undefined as never);

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toContain('/progress/import');
    expect(JSON.parse((init as RequestInit).body as string).items[0]).toMatchObject({
      activitySlug: 'atividade-01',
      bestScore: 6,
    });
    expect(readGuestProgress()).toEqual([]);
    expect(atomStore.get(pendingAtom)).toEqual({});
  });

  it('mantém o progresso local quando a importação falha', async () => {
    const atomStore = store();
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    saveGuestProgress({ activitySlug: 'atividade-01', ...report });

    await atomStore.set(importGuestProgressAtom, undefined as never);

    // Nada se perde: a fila reenvia quando a rede voltar.
    expect(readGuestProgress()).toHaveLength(1);
  });
});
