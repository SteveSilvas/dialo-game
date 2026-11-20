import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TrailNode from './index';
import type { Module } from '../../api/types';

const buildModule = (overrides: Partial<Module> = {}): Module => ({
  slug: 'modulo-02',
  title: 'Sons das letras',
  description: 'Consciência fonológica.',
  concept: 'Sons',
  order: 2,
  status: 'current',
  isUnlocked: true,
  requiredTotal: 5,
  requiredCompleted: 2,
  stars: 4,
  maxStars: 15,
  activities: [],
  ...overrides,
});

const renderNode = (module: Module, props: { lockedReason?: string; pulse?: boolean } = {}) =>
  render(
    <MemoryRouter>
      <TrailNode module={module} href="/modulo-02" {...props} />
    </MemoryRouter>,
  );

/**
 * Mesma comparação da regra `label-content-name-mismatch` do axe: o texto
 * visível, sem pontuação, precisa aparecer como subsequência contígua dentro
 * do nome acessível.
 */
const containsVisibleLabel = (name: string, visible: string): boolean => {
  const tokenize = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter(Boolean);

  const nameTokens = tokenize(name);
  const labelTokens = tokenize(visible);
  if (labelTokens.length === 0) return true;

  return nameTokens.some((_, start) =>
    labelTokens.every((token, offset) => nameTokens[start + offset] === token),
  );
};

describe('TrailNode', () => {
  it('estado concluído: link real com check, estrelas e nome acessível completo', () => {
    renderNode(buildModule({ status: 'completed', slug: 'modulo-01', order: 1 }));

    const link = screen.getByRole('link', { name: /Módulo 1: Sons das letras/i });
    expect(link).toHaveAttribute('href', '/modulo-02');
    expect(link).toHaveAttribute('data-state', 'completed');
    expect(link).toHaveAccessibleName(
      'Módulo 1: Sons das letras. Concluído · ★ 4 de 15. Abrir módulo.',
    );
    expect(screen.getByText(/CONCLUÍDO/)).toBeInTheDocument();
  });

  it('o nome acessível contém o texto visível (WCAG 2.5.3)', () => {
    renderNode(buildModule({ status: 'current' }));

    const link = screen.getByRole('link', { name: /Módulo 2/i });
    const name = link.getAttribute('aria-label')!;

    expect(containsVisibleLabel(name, link.textContent!)).toBe(true);
  });

  it('estado atual: link real que pulsa e informa o progresso', () => {
    const { container } = renderNode(buildModule({ status: 'current' }), { pulse: true });

    const link = screen.getByRole('link', { name: /Módulo 2: Sons das letras/i });
    expect(link).toHaveAttribute('href', '/modulo-02');
    expect(link).toHaveAttribute('data-state', 'current');
    expect(link).toHaveClass('trail-node--current');
    expect(link).toHaveClass('trail-node--pulse');
    expect(link).toHaveAccessibleName(
      'Módulo 2: Sons das letras. Você está aqui · 2 de 5 · ★ 4 de 15. Abrir módulo.',
    );
    expect(container.querySelector('.trail-node__icon svg')).toBeInTheDocument();
  });

  it('estado bloqueado: não é link, mostra cadeado e o motivo em texto', () => {
    renderNode(
      buildModule({ status: 'locked', isUnlocked: false, order: 3 }),
      { lockedReason: 'Conclua o módulo 2: Sons das letras' },
    );

    expect(
      screen.queryByRole('link', { name: /Módulo 3/i }),
    ).not.toBeInTheDocument();

    const node = screen.getByRole('group', {
      name: /Módulo 3: Sons das letras. Conclua o módulo 2: Sons das letras. Bloqueado./,
    });
    expect(node).toHaveAttribute('aria-disabled', 'true');
    expect(node).toHaveAttribute('data-state', 'locked');
    expect(node).toHaveTextContent(/CONCLUA O MÓDULO 2: SONS DAS LETRAS/);
  });

  it('trata como bloqueado o módulo que a API marcou como não liberado', () => {
    // `status` e `isUnlocked` podem divergir; o desbloqueio do servidor manda,
    // inclusive no visual: nada de "VOCÊ ESTÁ AQUI" num nó que não navega.
    renderNode(buildModule({ status: 'current', isUnlocked: false }));

    expect(screen.queryByRole('link')).not.toBeInTheDocument();

    const node = screen.getByRole('group', {
      name: /Conclua o módulo anterior. Bloqueado./i,
    });
    expect(node).toHaveAttribute('aria-disabled', 'true');
    expect(node).toHaveClass('trail-node--locked');
    expect(node).not.toHaveTextContent(/VOCÊ ESTÁ AQUI/);
    expect(node).toHaveTextContent(/CONCLUA O MÓDULO ANTERIOR/);
  });

  it('não pulsa quando o movimento reduzido está ligado', () => {
    renderNode(buildModule({ status: 'current' }), { pulse: false });

    const link = screen.getByRole('link', { name: /Módulo 2/i });
    expect(link).toHaveClass('trail-node--current');
    expect(link).not.toHaveClass('trail-node--pulse');
  });
});
