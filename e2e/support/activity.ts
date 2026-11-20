import { expect, type Locator, type Page } from '@playwright/test';

export const isLetter = (item: string) => /^[a-z]$/.test(item);
export const isNumber = (item: string) => item.trim() !== '' && Number.isFinite(Number(item));
export const isVowel = (item: string) => ['a', 'e', 'i', 'o', 'u'].includes(item);
export const isConsonant = (item: string) => isLetter(item) && !isVowel(item);

export const activityGrid = (page: Page): Locator =>
  page.getByRole('group', { name: 'Símbolos da atividade' });

/**
 * Conclui uma atividade de seleção clicando em todos os itens válidos. A regra
 * é a mesma de `src/utils/validations.ts`: o teste não decide o que é "certo",
 * só repete o que o jogo aceita.
 */
export const playActivity = async (
  page: Page,
  isValid: (item: string) => boolean,
): Promise<void> => {
  const grid = activityGrid(page);
  const buttons = grid.getByRole('button');
  await expect(buttons.first()).toBeVisible();

  const targets = (await buttons.allInnerTexts())
    .map((label) => label.trim())
    .filter((label) => label !== '' && isValid(label.toLowerCase()));

  expect(targets.length, 'a atividade precisa ter ao menos um item válido').toBeGreaterThan(0);

  for (const target of targets) {
    // O rótulo acessível do botão é o símbolo em maiúsculas.
    await grid.getByRole('button', { name: target.toUpperCase(), exact: true }).click();
  }

  // O item fica 1 s em animação de saída antes de sair da grade; o botão de
  // avanço só aparece quando a atividade é dada por concluída. Na última
  // atividade do módulo ele é CONCLUIR MÓDULO, não PRÓXIMA.
  await expect(
    page.getByRole('link', { name: /^(PRÓXIMA|CONCLUIR MÓDULO)$/ }),
  ).toBeVisible({ timeout: 20_000 });
};
