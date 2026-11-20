import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

export type AuditOptions = {
  /** Rótulo da tela, usado na mensagem de falha. */
  screen: string;
};

/**
 * Auditoria WCAG 2.1 nível AA. O padrão da API é medir impacto `critical` e
 * `serious`; qualquer um deles quebra o build. Violações menores ficam de fora
 * de propósito: contraste de elemento decorativo não deve parar um PR.
 */
export const expectNoA11yViolations = async (
  page: Page,
  { screen }: AuditOptions,
): Promise<void> => {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  const blocking = results.violations.filter(
    (violation) => violation.impact === 'critical' || violation.impact === 'serious',
  );

  const report = blocking
    .map((violation) => {
      const nodes = violation.nodes
        .map((node) => `    ${node.target.join(' ')}\n      ${node.failureSummary ?? ''}`)
        .join('\n');
      return `  [${violation.impact}] ${violation.id}: ${violation.help}\n${nodes}`;
    })
    .join('\n');

  expect(blocking, `Acessibilidade em ${screen}:\n${report}`).toEqual([]);
};
