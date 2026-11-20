import type { Activity, Module } from '../api/types';
import { findNextModule, summarizeGuestModule, summarizeModule } from './moduleSummary';

const activity = (
  slug: string,
  progress: Partial<Activity['progress']> | null = null,
  isRequired = true,
): Activity => ({
  slug,
  title: slug,
  type: 'selectSymbols',
  order: Number(slug.slice(-2)),
  isRequired,
  configJson: '{}',
  progress: progress
    ? {
        activitySlug: slug,
        bestScore: 0,
        attempts: 0,
        errors: 0,
        stars: 0,
        completedAt: null,
        ...progress,
      }
    : null,
});

const buildModule = (overrides: Partial<Module> = {}): Module => ({
  slug: 'modulo-01',
  title: 'Reconhecer letras',
  description: 'Símbolos',
  concept: 'letras',
  order: 1,
  status: 'current',
  isUnlocked: true,
  requiredTotal: 2,
  requiredCompleted: 0,
  stars: 0,
  maxStars: 6,
  activities: [activity('atividade-01'), activity('atividade-02')],
  ...overrides,
});

describe('summarizeModule', () => {
  it('soma acertos e erros das atividades e as estrelas do servidor', () => {
    const module = buildModule({
      stars: 5,
      requiredCompleted: 2,
      activities: [
        activity('atividade-01', {
          bestScore: 8,
          errors: 1,
          completedAt: '2026-01-01T00:00:00+00:00',
        }),
        activity('atividade-02', {
          bestScore: 4,
          errors: 2,
          completedAt: '2026-01-02T00:00:00+00:00',
        }),
      ],
    });

    expect(summarizeModule(module)).toEqual({
      hits: 12,
      errors: 3,
      stars: 5,
      maxStars: 6,
      completed: 2,
      total: 2,
      isComplete: true,
    });
  });

  it('calcula as estrelas localmente quando o catálogo ainda não confirmou', () => {
    const module = buildModule({
      requiredTotal: 2,
      activities: [
        activity('atividade-01', {
          bestScore: 8,
          errors: 0,
          completedAt: '2026-01-01T00:00:00+00:00',
        }),
      ],
    });

    const summary = summarizeModule(module);

    expect(summary.stars).toBe(3);
    expect(summary.total).toBe(1);
    expect(summary.isComplete).toBe(true);
  });

  it('não piora o que o catálogo tem quando recebe o último resultado', () => {
    const module = buildModule({
      stars: 6,
      activities: [
        activity('atividade-01', {
          bestScore: 10,
          errors: 0,
          completedAt: '2026-01-01T00:00:00+00:00',
        }),
        activity('atividade-02'),
      ],
    });

    const summary = summarizeModule(module, {
      activitySlug: 'atividade-01',
      bestScore: 2,
      errors: 5,
      completed: true,
    });

    expect(summary.hits).toBe(10);
    expect(summary.errors).toBe(0);
  });

  it('usa o último resultado para fechar o módulo antes de a API responder', () => {
    const module = buildModule({
      requiredTotal: 2,
      requiredCompleted: 1,
      activities: [
        activity('atividade-01', {
          bestScore: 8,
          errors: 0,
          completedAt: '2026-01-01T00:00:00+00:00',
        }),
        activity('atividade-02'),
      ],
    });

    const summary = summarizeModule(module, {
      activitySlug: 'atividade-02',
      bestScore: 6,
      errors: 1,
      completed: true,
    });

    expect(summary.completed).toBe(2);
    expect(summary.isComplete).toBe(true);
    expect(summary.hits).toBe(14);
    expect(summary.errors).toBe(1);
  });

  it('ignora atividade fora do módulo', () => {
    const module = buildModule();

    const summary = summarizeModule(module, {
      activitySlug: 'atividade-99',
      bestScore: 50,
      errors: 0,
      completed: true,
    });

    expect(summary.hits).toBe(0);
    expect(summary.isComplete).toBe(false);
  });

  it('não conta como completo um módulo sem atividades obrigatórias', () => {
    const module = buildModule({ activities: [], requiredTotal: 0 });

    expect(summarizeModule(module).isComplete).toBe(false);
  });
});

describe('summarizeGuestModule', () => {
  it('resume a partir do progresso local, casando pelo slug', () => {
    const summary = summarizeGuestModule(
      ['atividade-01', 'atividade-02'],
      [
        {
          activitySlug: 'atividade-01',
          bestScore: 9,
          errors: 0,
          completed: true,
        },
        {
          activitySlug: 'atividade-02',
          bestScore: 5,
          errors: 5,
          completed: true,
        },
      ],
    );

    expect(summary).toEqual({
      hits: 14,
      errors: 5,
      stars: 4,
      maxStars: 6,
      completed: 2,
      total: 2,
      isComplete: true,
    });
  });

  it('trata atividade ainda não jogada como zero', () => {
    const summary = summarizeGuestModule(['atividade-01', 'atividade-02'], [
      { activitySlug: 'atividade-01', bestScore: 4, errors: 0, completed: true },
    ]);

    expect(summary.completed).toBe(1);
    expect(summary.isComplete).toBe(false);
    expect(summary.hits).toBe(4);
  });
});

describe('findNextModule', () => {
  it('devolve o módulo seguinte pela ordem, não pela posição na lista', () => {
    const current = buildModule();
    const modules = [
      buildModule({ slug: 'modulo-03', order: 3 }),
      current,
      buildModule({ slug: 'modulo-02', order: 2 }),
    ];

    expect(findNextModule(modules, current)?.slug).toBe('modulo-02');
  });

  it('devolve undefined no último módulo', () => {
    const current = buildModule({ slug: 'modulo-09', order: 9 });

    expect(findNextModule([current], current)).toBeUndefined();
  });
});
