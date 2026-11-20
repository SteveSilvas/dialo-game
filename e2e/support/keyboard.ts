import { expect, type Page } from '@playwright/test';

export type FocusedElement = {
  /** Texto visível, ou `aria-label` quando o elemento é só ícone. */
  name: string;
  tag: string;
  href: string | null;
  /** `true` quando o navegador desenhou o anel de foco do teclado. */
  focusVisible: boolean;
  /** Está dentro da grade de símbolos da atividade. */
  inGrid: boolean;
  gridLabel: string | null;
};

const readFocusNow = (page: Page): Promise<FocusedElement | null> =>
  page.evaluate(() => {
    const element = document.activeElement as HTMLElement | null;
    if (!element || element === document.body) return null;

    // Campos de formulário não têm texto: o nome vem do <label> associado.
    const label = 'labels' in element ? (element as HTMLInputElement).labels?.[0] : null;
    const group = element.closest('[role="group"]');

    return {
      name: (
        element.innerText ||
        element.getAttribute('aria-label') ||
        label?.textContent ||
        ''
      ).trim(),
      tag: element.tagName.toLowerCase(),
      href: element.getAttribute('href'),
      focusVisible: element.matches(':focus-visible'),
      inGrid: group !== null,
      gridLabel: group?.getAttribute('aria-label') ?? null,
    };
  });

/**
 * Avança o foco com Tab até o elemento esperado. Devolve o que ficou focado
 * para o teste afirmar sobre o elemento real, não sobre o seletor.
 */
export const tabUntil = async (
  page: Page,
  matches: (focused: FocusedElement) => boolean,
  { maxTabs = 200 }: { maxTabs?: number } = {},
): Promise<FocusedElement> => {
  for (let step = 0; step < maxTabs; step++) {
    await page.keyboard.press('Tab');

    const focused = await readFocus(page);
    if (focused && matches(focused)) return focused;
  }

  throw new Error(`${maxTabs} Tabs sem encontrar o elemento esperado.`);
};

/** Tab até um elemento cujo nome acessível case com a expressão. */
export const tabTo = (
  page: Page,
  name: string | RegExp,
  options?: { maxTabs?: number },
): Promise<FocusedElement> =>
  tabUntil(
    page,
    (focused) =>
      typeof name === 'string' ? focused.name === name : name.test(focused.name),
    options,
  );

/**
 * Lê o foco esperando o reposicionamento quando ele caiu no `<body>`.
 * `SymbolsGrid` recoloca o foco em `useLayoutEffect`, no mesmo quadro da
 * remoção; a espera curta cobre só o intervalo entre o render e a leitura. Se o
 * foco continuar perdido, o teste falha — que é o que se quer detectar.
 */
export const readFocus = async (
  page: Page,
  { timeout = 0 }: { timeout?: number } = {},
): Promise<FocusedElement | null> => {
  const deadline = Date.now() + timeout;

  for (;;) {
    const focused = await readFocusNow(page);
    if (focused || Date.now() >= deadline) return focused;
    await page.waitForTimeout(20);
  }
};

export const currentFocus = readFocus;

/**
 * Joga a atividade inteira só pelo teclado: Tab para percorrer a grade, Enter
 * para escolher. É o caminho que um leitor de tela usa, e o que quebra quando
 * um botão não é focável.
 */
export const playActivityByKeyboard = async (
  page: Page,
  isValid: (item: string) => boolean,
): Promise<void> => {
  await tabTo(page, 'Reiniciar atividade');
  await page.keyboard.press('Tab');

  const grid = page.getByRole('group', { name: 'Símbolos da atividade' });

  const nextButton = page.getByRole('link', { name: /^(PRÓXIMA|CONCLUIR MÓDULO)$/ });

  for (let step = 0; step < 400; step++) {
    if (await nextButton.isVisible()) break;

    const focused = await readFocus(page, { timeout: 1_000 });
    expect(focused, 'o foco não pode se perder no meio da atividade').not.toBeNull();

    const isTarget =
      focused!.inGrid &&
      focused!.gridLabel === 'Símbolos da atividade' &&
      isValid(focused!.name.toLowerCase());

    if (isTarget) {
      const before = await grid.getByRole('button').count();
      await page.keyboard.press('Enter');

      // O item escolhido fica 1 s na animação de saída antes de sair da grade,
      // e só então o foco é reposicionado no vizinho.
      await expect
        .poll(() => grid.getByRole('button').count(), {
          message: `"${focused!.name}" sai da grade depois do Enter`,
          timeout: 5_000,
        })
        .toBeLessThan(before);
    } else {
      await page.keyboard.press('Tab');
    }
  }

  await expect(nextButton).toBeVisible({ timeout: 20_000 });
};
