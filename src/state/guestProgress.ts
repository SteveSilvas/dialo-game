import type { ActivityProgressInput, Module } from '../api/types';
import { calculateStars, mergeBestAttempt } from '../utils/scoring';

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

/**
 * Sobrepõe o progresso do `localStorage` no catálogo do servidor. O servidor
 * não conhece o convidado, então sem isso a trilha mostraria tudo zerado e a
 * checagem de fim de módulo nunca fecharia.
 */
export const applyGuestProgress = (modules: Module[]): Module[] => {
  const guest = readGuestProgress();
  if (guest.length === 0) return modules;

  return modules.map((module) => {
    const activities = module.activities.map((activity) => {
      const saved = guest.find((item) => item.activitySlug === activity.slug);
      if (!saved) return activity;

      return {
        ...activity,
        progress: {
          activitySlug: activity.slug,
          bestScore: saved.bestScore,
          attempts: saved.attempts,
          errors: saved.errors,
          stars: calculateStars(saved.bestScore, saved.errors),
          completedAt: saved.completed ? new Date().toISOString() : null,
        },
      };
    });

    const required = activities.filter((activity) => activity.isRequired);

    return {
      ...module,
      activities,
      requiredCompleted: required.filter((activity) => activity.progress?.completedAt)
        .length,
      stars: activities.reduce(
        (sum, activity) => sum + (activity.progress?.stars ?? 0),
        0,
      ),
    };
  });
};
