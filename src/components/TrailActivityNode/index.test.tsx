import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TrailActivityNode from './index';
import type { Activity } from '../../api/types';

const buildActivity = (overrides: Partial<Activity> = {}): Activity => ({
  slug: 'atividade-01',
  title: 'Selecionar as letras',
  type: 'selectSymbols',
  order: 1,
  isRequired: true,
  configJson: '{}',
  progress: null,
  ...overrides,
});

const renderNode = (activity: Activity) =>
  render(
    <MemoryRouter>
      <TrailActivityNode
        activity={activity}
        position={1}
        href="/modulo-01/atividade-01"
      />
    </MemoryRouter>,
  );

describe('TrailActivityNode', () => {
  it('atividade não iniciada: link real com nome acessível', () => {
    renderNode(buildActivity());

    const link = screen.getByRole('link', { name: /Atividade 1: Selecionar as letras/i });
    expect(link).toHaveAttribute('href', '/modulo-01/atividade-01');
    expect(link).toHaveAttribute('data-state', 'pending');
    expect(link).toHaveAccessibleName(
      'Atividade 1: Selecionar as letras. Não iniciada.',
    );
  });

  it('atividade em andamento: distingue de não iniciada', () => {
    renderNode(
      buildActivity({
        progress: {
          activitySlug: 'atividade-01',
          bestScore: 2,
          attempts: 1,
          errors: 0,
          stars: 0,
          completedAt: null,
        },
      }),
    );

    const link = screen.getByRole('link', { name: /Atividade 1/i });
    expect(link).toHaveAttribute('data-state', 'started');
    expect(link).toHaveAccessibleName('Atividade 1: Selecionar as letras. Em andamento.');
  });

  it('atividade concluída: mostra check, estrelas e estado no nome acessível', () => {
    renderNode(
      buildActivity({
        progress: {
          activitySlug: 'atividade-01',
          bestScore: 8,
          attempts: 1,
          errors: 0,
          stars: 3,
          completedAt: '2026-11-20T00:00:00Z',
        },
      }),
    );

    const link = screen.getByRole('link', { name: /Atividade 1/i });
    expect(link).toHaveAttribute('data-state', 'completed');
    expect(link).toHaveAccessibleName(
      'Atividade 1: Selecionar as letras. Concluída, 3 de 3 estrelas.',
    );
    // As estrelas são decorativas: o valor já está no nome acessível.
    expect(link.querySelectorAll('.trail-activity__stars svg')).toHaveLength(3);
  });
});
