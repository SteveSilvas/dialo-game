import type { Activity, Module } from '../api/types';

/** Tela da trilha completa, usada quando não há atividade para retomar. */
export const TRAIL_PATH = '/trilha';

/**
 * Rotas por módulo. Só o módulo 01 tem telas de atividade hoje; um módulo novo
 * cai na trilha até ganhar rota própria — melhor voltar um nível do que mandar
 * a criança para um 404.
 */
const MODULE_PATHS: Record<string, string> = {
  'modulo-01': '/modulo-01',
};

export const activityPath = (moduleSlug: string, activitySlug: string): string => {
  const base = MODULE_PATHS[moduleSlug];
  return base ? `${base}/${activitySlug}` : TRAIL_PATH;
};

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
 * recusaria o progresso com 403.
 */
export const resumeTarget = (modules: readonly Module[]): ResumeTarget | null => {
  const playable = byOrder(modules).filter((module) => module.isUnlocked);

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
