import { atom, type Setter } from 'jotai';
import { importProgress, recordProgress } from '../api/catalog';
import { ApiError } from '../api/client';
import type { ActivityProgressInput } from '../api/types';
import {
  clearGuestProgress,
  readGuestProgress,
  removeGuestProgress,
  saveGuestProgress,
  type GuestProgress,
} from './guestProgress';

/** Progresso de uma atividade, do jeito que o aparelho e o servidor guardam. */
export type ProgressRecord = ActivityProgressInput & { activitySlug: string };

export type ProgressMap = Record<string, ProgressRecord>;

export type ProgressSyncStatus =
  /** Nada foi gravado nesta sessão: o indicador não aparece. */
  | 'idle'
  /** Guardado no aparelho (modo convidado). */
  | 'local'
  /** Enviando para o servidor. */
  | 'saving'
  /** O servidor confirmou tudo. */
  | 'saved'
  /** O servidor não respondeu; a fila tenta de novo. */
  | 'offline';

export const toProgressMap = (items: GuestProgress[]): ProgressMap =>
  Object.fromEntries(items.map((item) => [item.activitySlug, item]));

/**
 * Progresso conhecido neste aparelho: o do convidado (que é o jogo inteiro) e
 * o de quem tem conta que o catálogo em mãos ainda não mostra.
 *
 * Guarda também o que o servidor acabou de confirmar. O catálogo só é buscado
 * na troca de sessão, então tirar a atividade daqui no instante do `PUT` faria
 * as estrelas piscarem de volta a zero.
 */
export const progressAtom = atom<ProgressMap>({});

/**
 * Atividades que o servidor ainda não confirmou — o que está no
 * `localStorage` e precisa subir. Depois de confirmada, a atividade continua
 * em `progressAtom`, mas sai daqui.
 */
export const pendingAtom = atom<ProgressMap>({});

/** A fila de envio, na ordem em que as tentativas foram salvas. */
export const progressQueueAtom = atom<ProgressRecord[]>((get) =>
  Object.values(get(pendingAtom)),
);

export const syncStatusAtom = atom<ProgressSyncStatus>('idle');

export type ReportProgressPayload = {
  activitySlug: string;
  report: ActivityProgressInput;
  /** `false` no modo convidado: não há conta para onde sincronizar. */
  sync: boolean;
};

/**
 * Escrita otimista: o progresso vale no aparelho antes de o servidor
 * responder. `saveGuestProgress` nunca piora o registro guardado, então
 * repetir a mesma atividade à vontade é seguro.
 */
export const reportProgressAtom = atom(
  null,
  (_get, set, payload: ReportProgressPayload): ProgressRecord => {
    // A gravação lê o storage antes de escrever: não depende de a hidratação
    // ter rodado, então nenhuma tela apaga o que já está guardado só por
    // montar antes do `Layout`.
    const items = saveGuestProgress({
      activitySlug: payload.activitySlug,
      ...payload.report,
    });

    const pending = toProgressMap(items);
    const saved = pending[payload.activitySlug]!;

    set(pendingAtom, pending);
    set(progressAtom, (current) => ({ ...current, [payload.activitySlug]: saved }));
    set(syncStatusAtom, payload.sync ? 'saving' : 'local');

    return saved;
  },
);

const send = (item: ProgressRecord) =>
  recordProgress(item.activitySlug, {
    bestScore: item.bestScore,
    attempts: item.attempts,
    errors: item.errors,
    completed: item.completed,
  });

/** Tira a atividade da fila sem esquecer o que já vale na tela. */
const confirm = (set: Setter, activitySlug: string) => {
  removeGuestProgress(activitySlug);
  set(pendingAtom, toProgressMap(readGuestProgress()));
};

// Um envio por vez: a rodada em curso relê a fila a cada item e já pega o que
// chegou no meio do caminho. Chamadas concorrentes recebem a mesma promise.
let inFlight: Promise<ProgressSyncStatus> | null = null;

/**
 * Esvazia a fila, uma atividade por vez. Falha de rede interrompe a rodada e
 * deixa o resto na fila: o `localStorage` continua com tudo, então nada se
 * perde enquanto o servidor estiver fora — quem chama decide quando tentar de
 * novo (ver `useProgressSync`).
 */
export const flushProgressAtom = atom(null, (get, set): Promise<ProgressSyncStatus> => {
  if (inFlight) return inFlight;

  const run = async (): Promise<ProgressSyncStatus> => {
    // Fila vazia não é novidade para ninguém: sem isso, um `online` qualquer
    // faria o indicador anunciar "Salvo" sem nada ter sido enviado.
    if (get(progressQueueAtom).length === 0) return get(syncStatusAtom);

    set(syncStatusAtom, 'saving');

    for (;;) {
      const [item] = get(progressQueueAtom);
      if (!item) {
        set(syncStatusAtom, 'saved');
        return 'saved';
      }

      const sent = JSON.stringify(item);

      try {
        await send(item);
      } catch (error) {
        // 403 = módulo bloqueado, 404 = atividade fora do catálogo: insistir
        // não muda a resposta e o catálogo do servidor é que manda.
        if (error instanceof ApiError && !error.isOffline) {
          confirm(set, item.activitySlug);
          continue;
        }

        set(syncStatusAtom, 'offline');
        return 'offline';
      }

      // Uma tentativa nova pode ter entrado durante o envio: aí o registro
      // guardado é maior que o enviado e precisa subir também.
      const stored = get(progressQueueAtom).find(
        (queued) => queued.activitySlug === item.activitySlug,
      );
      if (stored && JSON.stringify(stored) !== sent) continue;

      confirm(set, item.activitySlug);
    }
  };

  inFlight = run().finally(() => {
    inFlight = null;
  });

  return inFlight;
});

/**
 * Zera o progresso em memória na saída da conta: o aparelho pode ser
 * compartilhado, e a sobreposição da trilha não pode levar as estrelas de uma
 * criança para o catálogo de outra. O `localStorage` do convidado fica intacto.
 */
export const resetProgressAtom = atom(null, (_get, set) => {
  set(progressAtom, {});
  set(pendingAtom, {});
  set(syncStatusAtom, 'idle');
});

/**
 * Leva o progresso de convidado para a conta recém-logada. Lê o
 * `localStorage` direto, e não o átomo, porque o login pode acontecer antes de
 * a hidratação rodar. A API só melhora o que já existe, então repetir a
 * importação é seguro.
 *
 * Falha mantém tudo no aparelho: a sincronização em segundo plano reenvia
 * atividade por atividade assim que a rede voltar.
 */
export const importGuestProgressAtom = atom(null, async (_get, set) => {
  const items = readGuestProgress();
  if (items.length === 0) return;

  try {
    await importProgress(items);
    clearGuestProgress();
    set(pendingAtom, {});
  } catch {
    // Mantém o progresso local: a fila tenta de novo.
  }
});
