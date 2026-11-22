import {
  activityPath,
  isModuleCompleted,
  resumeTarget,
  summarizeProgress,
} from './progress';
import type { Activity, Module } from '../api/types';

const activity = (
  slug: string,
  order: number,
  completed = false,
  isRequired = true,
): Activity => ({
  slug,
  title: slug,
  type: 'selectSymbols',
  order,
  isRequired,
  configJson: '{}',
  progress: completed
    ? {
        activitySlug: slug,
        bestScore: 4,
        attempts: 4,
        errors: 0,
        stars: 3,
        completedAt: '2026-01-01T00:00:00+00:00',
      }
    : null,
});

const buildModule = (
  slug: string,
  order: number,
  activities: Activity[],
  { isUnlocked = true }: { isUnlocked?: boolean } = {},
): Module => {
  const required = activities.filter((item) => item.isRequired);
  const requiredCompleted = required.filter((item) => item.progress?.completedAt).length;

  return {
    slug,
    title: slug,
    description: '',
    concept: '',
    order,
    status: isUnlocked ? 'current' : 'locked',
    isUnlocked,
    requiredTotal: required.length,
    requiredCompleted,
    stars: activities.reduce((sum, item) => sum + (item.progress?.stars ?? 0), 0),
    maxStars: activities.length * 3,
    activities,
  };
};

describe('activityPath', () => {
  it('monta a rota da atividade no módulo 01', () => {
    expect(activityPath('modulo-01', 'atividade-02')).toBe('/modulo-01/atividade-02');
  });

  it('usa a rota genérica quando o módulo não tem telas próprias', () => {
    expect(activityPath('modulo-02', 'atividade-01')).toBe('/modulo/modulo-02/atividade-01');
  });
});

describe('resumeTarget', () => {
  it('aponta para a primeira atividade pendente do módulo liberado', () => {
    const modules = [
      buildModule('modulo-01', 1, [
        activity('atividade-01', 1, true),
        activity('atividade-02', 2),
        activity('atividade-03', 3),
      ]),
    ];

    const target = resumeTarget(modules);

    expect(target?.activitySlug).toBe('atividade-02');
    expect(target?.href).toBe('/modulo-01/atividade-02');
    expect(target?.replay).toBe(false);
  });

  it('respeita a ordem do catálogo, não a ordem do array', () => {
    const modules = [
      buildModule('modulo-01', 1, [activity('atividade-02', 2), activity('atividade-01', 1)]),
    ];

    expect(resumeTarget(modules)?.activitySlug).toBe('atividade-01');
  });

  it('pula módulo bloqueado, que o servidor recusaria com 403', () => {
    const modules = [
      buildModule('modulo-01', 1, [activity('atividade-01', 1, true)]),
      buildModule('modulo-02', 2, [activity('atividade-01', 1)], { isUnlocked: false }),
    ];

    const target = resumeTarget(modules);

    expect(target?.moduleSlug).toBe('modulo-01');
    expect(target?.replay).toBe(true);
  });

  it('oferece repetir quando tudo já foi concluído', () => {
    const modules = [buildModule('modulo-01', 1, [activity('atividade-01', 1, true)])];

    const target = resumeTarget(modules);

    expect(target?.replay).toBe(true);
    expect(target?.href).toBe('/modulo-01/atividade-01');
  });

  it('não inventa alvo quando o catálogo está vazio', () => {
    expect(resumeTarget([])).toBeNull();
  });

  it('não manda a criança para módulo sem tela de atividade', () => {
    // Módulo 01 concluído e 02 liberado: sem player, "CONTINUAR" cairia na
    // trilha dizendo que parou numa atividade que não abre.
    const modules = [
      buildModule('modulo-01', 1, [activity('atividade-01', 1, true)]),
      buildModule('modulo-02', 2, [activity('modulo-02-atividade-01', 1)]),
    ];

    const target = resumeTarget(modules);

    expect(target?.moduleSlug).toBe('modulo-01');
    expect(target?.replay).toBe(true);
    expect(target?.href).toBe('/modulo-01/atividade-01');
  });
});

describe('summarizeProgress', () => {
  it('soma módulos concluídos, estrelas e atividades', () => {
    const modules = [
      buildModule('modulo-01', 1, [
        activity('atividade-01', 1, true),
        activity('atividade-02', 2, true),
      ]),
      buildModule('modulo-02', 2, [activity('atividade-01', 1)], { isUnlocked: false }),
    ];

    expect(summarizeProgress(modules)).toEqual({
      modulesCompleted: 1,
      modulesTotal: 2,
      stars: 6,
      maxStars: 9,
      activitiesCompleted: 2,
      activitiesTotal: 3,
    });
  });

  it('zera o resumo sem catálogo', () => {
    expect(summarizeProgress([])).toEqual({
      modulesCompleted: 0,
      modulesTotal: 0,
      stars: 0,
      maxStars: 0,
      activitiesCompleted: 0,
      activitiesTotal: 0,
    });
  });
});

describe('isModuleCompleted', () => {
  it('exige todas as atividades obrigatórias concluídas', () => {
    const pending = buildModule('modulo-01', 1, [
      activity('atividade-01', 1, true),
      activity('atividade-02', 2),
    ]);
    const done = buildModule('modulo-01', 1, [
      activity('atividade-01', 1, true),
      activity('atividade-02', 2, true),
    ]);

    expect(isModuleCompleted(pending)).toBe(false);
    expect(isModuleCompleted(done)).toBe(true);
  });
});
