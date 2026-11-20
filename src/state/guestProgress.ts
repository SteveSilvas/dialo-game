import type { ActivityProgressInput } from '../api/types';
import { mergeBestAttempt } from '../utils/scoring';

const STORAGE_KEY = 'dialo:guest-progress:v1';

export type GuestProgress = ActivityProgressInput & {
  activitySlug: string;
};

const toCount = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
};

/**
 * Progresso de quem joga sem conta. Fica no `localStorage` porque precisa
 * sobreviver ao fechamento do navegador — diferente do token, que fica só em
 * memória.
 *
 * Os números são normalizados na leitura: uma entrada antiga ou editada à mão
 * não pode virar `NaN` e zerar as estrelas da criança.
 */
export const readGuestProgress = (): GuestProgress[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((item): GuestProgress[] => {
      if (typeof item !== 'object' || item === null) return [];

      const { activitySlug } = item as GuestProgress;
      if (typeof activitySlug !== 'string' || !activitySlug) return [];

      const record = item as Partial<GuestProgress>;
      return [
        {
          activitySlug,
          bestScore: toCount(record.bestScore),
          attempts: toCount(record.attempts),
          errors: toCount(record.errors),
          completed: record.completed === true,
        },
      ];
    });
  } catch {
    // Storage bloqueado (modo privado) ou conteúdo corrompido: começa vazio.
    return [];
  }
};

export const writeGuestProgress = (items: GuestProgress[]) => {
  try {
    // Fila vazia sai do storage em vez de virar `[]`: `getItem` nulo é o sinal
    // de "nada pendente" que a importação e o indicador usam.
    if (items.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  } catch {
    // Sem storage o jogo continua funcionando, só não guarda o progresso.
  }
};

/**
 * Reaproveita a regra de desempate do servidor (`mergeBestAttempt`): repetir
 * uma atividade nunca piora o registro guardado.
 */
export const mergeGuestProgress = (
  current: GuestProgress | undefined,
  next: GuestProgress,
): GuestProgress => {
  if (!current) return { ...next };

  return {
    activitySlug: current.activitySlug,
    ...mergeBestAttempt(current.bestScore, current.errors, next.bestScore, next.errors),
    attempts: current.attempts + next.attempts,
    completed: current.completed || next.completed,
  };
};

export const saveGuestProgress = (entry: GuestProgress): GuestProgress[] => {
  const items = readGuestProgress();
  const index = items.findIndex((item) => item.activitySlug === entry.activitySlug);

  if (index === -1) {
    items.push(entry);
  } else {
    items[index] = mergeGuestProgress(items[index], entry);
  }

  writeGuestProgress(items);
  return items;
};

/**
 * Descarta o registro de uma atividade que o servidor já confirmou: o
 * `localStorage` guarda só o que ainda não subiu, não um espelho do servidor.
 */
export const removeGuestProgress = (activitySlug: string): GuestProgress[] => {
  const items = readGuestProgress().filter((item) => item.activitySlug !== activitySlug);
  writeGuestProgress(items);
  return items;
};

export const clearGuestProgress = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nada a limpar.
  }
};
