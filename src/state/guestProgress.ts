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

const write = (items: GuestProgress[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Sem storage o jogo continua funcionando, só não guarda o progresso.
  }
};

/**
 * Reaproveita a regra de desempate do servidor (`mergeBestAttempt`): repetir
 * uma atividade nunca piora o registro guardado.
 */
const merge = (current: GuestProgress, next: GuestProgress): GuestProgress => ({
  activitySlug: current.activitySlug,
  ...mergeBestAttempt(current.bestScore, current.errors, next.bestScore, next.errors),
  attempts: current.attempts + next.attempts,
  completed: current.completed || next.completed,
});

export const saveGuestProgress = (entry: GuestProgress): GuestProgress[] => {
  const items = readGuestProgress();
  const index = items.findIndex((item) => item.activitySlug === entry.activitySlug);

  if (index === -1) {
    items.push(entry);
  } else {
    items[index] = merge(items[index]!, entry);
  }

  write(items);
  return items;
};

export const clearGuestProgress = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nada a limpar.
  }
};
