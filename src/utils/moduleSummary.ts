import type { Module } from '../api/types';
import { MAX_STARS, calculateStars, mergeBestAttempt } from './scoring';

/** Números que a tela de conclusão mostra ao fechar o módulo. */
export type ModuleSummary = {
  hits: number;
  errors: number;
  stars: number;
  maxStars: number;
  /** Atividades obrigatórias concluídas. */
  completed: number;
  total: number;
  isComplete: boolean;
};

/**
 * Resultado de uma atividade, do jeito que o catálogo e o progresso local
 * guardam. `activitySlug` permite casar o resultado que acabou de sair com a
 * entrada correspondente, sem contar duas vezes.
 */
export type ActivityResult = {
  activitySlug: string;
  bestScore: number;
  errors: number;
  completed: boolean;
};

type Result = Omit<ActivityResult, 'activitySlug'>;

const nonNegative = (value: number) =>
  Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;

const mergeResult = (current: Result, next: Result): Result => ({
  ...mergeBestAttempt(current.bestScore, current.errors, next.bestScore, next.errors),
  completed: current.completed || next.completed,
});

const toResult = (item: {
  bestScore?: number;
  errors?: number;
  completed?: boolean;
}): Result => ({
  bestScore: nonNegative(item.bestScore ?? 0),
  errors: nonNegative(item.errors ?? 0),
  completed: item.completed === true,
});

/**
 * Progresso por atividade, já com o último resultado aplicado.
 *
 * A tela de conclusão é aberta logo depois do registro da atividade, e a
 * resposta do servidor pode ainda não ter chegado ao catálogo. O resultado que
 * a criança acabou de fazer entra aqui pelo `mergeBestAttempt`, que nunca piora
 * o que o catálogo já traz — então tanto faz se a API chegou antes ou depois.
 */
const collectResults = (
  module: Module,
  lastResult?: ActivityResult,
): Map<string, Result> => {
  const results = new Map<string, Result>(
    module.activities.map((activity) => [
      activity.slug,
      toResult({
        bestScore: activity.progress?.bestScore,
        errors: activity.progress?.errors,
        completed: Boolean(activity.progress?.completedAt),
      }),
    ]),
  );

  if (lastResult && results.has(lastResult.activitySlug)) {
    results.set(
      lastResult.activitySlug,
      mergeResult(results.get(lastResult.activitySlug)!, toResult(lastResult)),
    );
  }

  return results;
};

const summarize = (
  module: Module,
  results: Map<string, Result>,
): ModuleSummary => {
  const all = [...results.values()];
  const required = module.activities.filter((activity) => activity.isRequired);
  const computedStars = all.reduce(
    (sum, result) => sum + calculateStars(result.bestScore, result.errors),
    0,
  );

  const total = required.length;
  const completed = required.filter(
    (activity) => results.get(activity.slug)?.completed === true,
  ).length;

  return {
    hits: all.reduce((sum, result) => sum + result.bestScore, 0),
    errors: all.reduce((sum, result) => sum + result.errors, 0),
    // As estrelas do servidor são a fonte da verdade para quem tem conta; o
    // cálculo local só evita um zero enquanto a API não confirma.
    stars: Math.max(nonNegative(module.stars), computedStars),
    maxStars:
      module.maxStars > 0 ? module.maxStars : module.activities.length * MAX_STARS,
    completed,
    total,
    isComplete: total > 0 && completed === total,
  };
};

export const summarizeModule = (
  module: Module,
  lastResult?: ActivityResult,
): ModuleSummary => summarize(module, collectResults(module, lastResult));

/**
 * Mesmo resumo sem catálogo, quando a API não responde: as atividades do
 * módulo vêm da trilha local e os números do `localStorage`.
 */
export const summarizeGuestModule = (
  slugs: string[],
  items: ActivityResult[],
  lastResult?: ActivityResult,
): ModuleSummary => {
  const results = slugs.map((slug) => {
    const saved = toResult(items.find((item) => item.activitySlug === slug) ?? {});

    // A gravação local é assíncrona em relação a esta checagem; aplicar o
    // resultado recém-concluído evita que o módulo deixe de fechar por correr
    // antes do `localStorage` ser atualizado.
    if (lastResult && lastResult.activitySlug === slug) {
      return mergeResult(saved, toResult(lastResult));
    }

    return saved;
  });

  const completed = results.filter((result) => result.completed).length;

  return {
    hits: results.reduce((sum, result) => sum + result.bestScore, 0),
    errors: results.reduce((sum, result) => sum + result.errors, 0),
    stars: results.reduce(
      (sum, result) => sum + calculateStars(result.bestScore, result.errors),
      0,
    ),
    maxStars: slugs.length * MAX_STARS,
    completed,
    total: slugs.length,
    isComplete: slugs.length > 0 && completed === slugs.length,
  };
};

/** Primeiro módulo da trilha depois do atual. */
export const findNextModule = (
  modules: Module[],
  current: Module,
): Module | undefined =>
  [...modules]
    .filter((module) => module.order > current.order)
    .sort((a, b) => a.order - b.order)[0];
