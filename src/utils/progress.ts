import type { Activity, Module } from '../api/types';
import { TRAIL_PATH, activityPath, isPlayableModule } from './paths';

export { TRAIL_PATH, activityPath };

const byOrder = <T extends { order: number }>(items: readonly T[]): T[] =>
  [...items].sort((a, b) => a.order - b.order);

const isCompleted = (activity: Activity) => Boolean(activity.progress?.completedAt);

export const isModuleCompleted = (module: Module): boolean =>
  module.requiredTotal > 0 && module.requiredCompleted >= module.requiredTotal;

export type ResumeTarget = {
  moduleSlug: string;
  moduleTitle: string;
  activitySlug: string;
  activityTitle: string;
  href: string;
  /** Todas as atividades já foram concluídas: o alvo é rever a trilha. */
  replay: boolean;
};

const targetOf = (
  module: Module,
  activity: Activity,
  replay: boolean,
): ResumeTarget => ({
  moduleSlug: module.slug,
  moduleTitle: module.title,
  activitySlug: activity.slug,
  activityTitle: activity.title,
  href: activityPath(module.slug, activity.slug),
  replay,
});

/**
 * Atividade onde a criança parou: a primeira pendente do primeiro módulo
 * liberado, na ordem do catálogo. Módulo bloqueado é ignorado porque o servidor
 * recusaria o progresso com 403; módulo sem tela de atividade também, porque não
 * existe para onde levar a criança.
 */
export const resumeTarget = (modules: readonly Module[]): ResumeTarget | null => {
  const playable = byOrder(modules).filter(
    (module) => module.isUnlocked && isPlayableModule(module.slug),
  );

  for (const module of playable) {
    const pending = byOrder(module.activities).find((activity) => !isCompleted(activity));
    if (pending) return targetOf(module, pending, false);
  }

  const first = playable[0];
  if (!first) return null;

  const replayActivity = byOrder(first.activities)[0];
  return replayActivity ? targetOf(first, replayActivity, true) : null;
};

export type ProgressSummary = {
  modulesCompleted: number;
  modulesTotal: number;
  stars: number;
  maxStars: number;
  activitiesCompleted: number;
  activitiesTotal: number;
};

export const summarizeProgress = (modules: readonly Module[]): ProgressSummary =>
  byOrder(modules).reduce<ProgressSummary>(
    (summary, module) => ({
      modulesCompleted: summary.modulesCompleted + (isModuleCompleted(module) ? 1 : 0),
      modulesTotal: summary.modulesTotal + 1,
      stars: summary.stars + module.stars,
      maxStars: summary.maxStars + module.maxStars,
      activitiesCompleted:
        summary.activitiesCompleted + module.activities.filter(isCompleted).length,
      activitiesTotal: summary.activitiesTotal + module.activities.length,
    }),
    {
      modulesCompleted: 0,
      modulesTotal: 0,
      stars: 0,
      maxStars: 0,
      activitiesCompleted: 0,
      activitiesTotal: 0,
    },
  );
