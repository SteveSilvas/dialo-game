import { expect, test } from '@playwright/test';
import { isConsonant, isLetter, isNumber, isVowel } from './support/activity';
import { currentFocus, playActivityByKeyboard, tabTo } from './support/keyboard';

/**
 * Trilha inteira sem mouse. Cada passo usa Tab para chegar ao controle e Enter
 * para ativá-lo — o mesmo caminho de quem usa leitor de tela ou não pode usar
 * ponteiro.
 *
 * O movimento reduzido vale para os testes de percurso: são dezenas de símbolos
 * por atividade, e a animação de saída de 1 s por acerto não é o que está sob
 * teste. O teste que verifica o reposicionamento do foco roda com a animação
 * normal, que é justamente o caso difícil.
 */
test.use({ reducedMotion: 'reduce' });

test.describe('trilha navegável só com teclado', () => {
  test('da capa ao fim da atividade 01, sem mouse', async ({ page }) => {
    await page.goto('/');

    const start = await tabTo(page, 'INICIAR');
    expect(start.href).toBe('/trilha');
    expect(start.focusVisible, 'o foco do teclado precisa ser visível').toBe(true);

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/trilha\/?$/);

    const letters = await tabTo(page, /LETRAS/i);
    expect(letters.href).toBe('/modulo-01/atividade-01');

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/modulo-01\/atividade-01$/);

    await playActivityByKeyboard(page, isLetter);

    const next = await tabTo(page, 'PRÓXIMA');
    expect(next.href).toBe('/modulo-01/atividade-02');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/modulo-01\/atividade-02$/);
  });

  test('percorre as cinco atividades e volta para o módulo', async ({ page }) => {
    const trail = [
      { slug: 'atividade-01', title: 'SELECIONE AS LETRAS', isValid: isLetter },
      { slug: 'atividade-02', title: 'SELECIONE OS NÚMEROS', isValid: isNumber },
      { slug: 'atividade-03', title: 'SELECIONE AS VOGAIS', isValid: isVowel },
      { slug: 'atividade-04', title: 'SELECIONE AS CONSOANTES', isValid: isConsonant },
      { slug: 'atividade-05', title: 'GUARDE AS LETRAS NA CAIXA', isValid: isConsonant },
    ];

    for (const { slug, title, isValid } of trail) {
      await page.goto(`/modulo-01/${slug}`);
      await expect(page.getByRole('heading', { name: title })).toBeVisible();

      await playActivityByKeyboard(page, isValid);

      // A última atividade fecha o módulo: o botão vira CONCLUIR MÓDULO.
      const next = slug === 'atividade-05' ? 'CONCLUIR MÓDULO' : 'PRÓXIMA';
      await tabTo(page, next);
      await page.keyboard.press('Enter');
    }

    await expect(page).toHaveURL(/\/modulo-01\/conclusao\/?$/);
  });

  test('a tela de entrada é navegável e anuncia o erro', async ({ page }) => {
    await page.goto('/entrar');

    await tabTo(page, 'Usuário ou email');
    await page.keyboard.type('nao-existe');
    await tabTo(page, 'Senha');
    await page.keyboard.type('SenhaErrada123');
    await tabTo(page, 'ENTRAR');
    await page.keyboard.press('Enter');

    await expect(page.getByRole('alert')).toBeVisible();
  });
});

test.describe('foco do teclado com a animação de saída ligada', () => {
  test('o foco não cai no body quando um acerto sai da grade', async ({ page }) => {
    await page.goto('/modulo-01/atividade-01');

    await tabTo(page, 'Reiniciar atividade');
    await page.keyboard.press('Tab');

    const first = await currentFocus(page);
    expect(first?.inGrid).toBe(true);

    let target = first;
    for (let step = 0; step < 60 && !isLetter(target?.name.toLowerCase() ?? ''); step++) {
      await page.keyboard.press('Tab');
      target = await currentFocus(page);
    }

    expect(isLetter(target?.name.toLowerCase() ?? '')).toBe(true);
    await page.keyboard.press('Enter');

    // Depois da animação de saída o foco precisa estar em outro botão da
    // grade: sem isso a criança teria de refazer o Tab desde o topo.
    await expect
      .poll(async () => (await currentFocus(page))?.inGrid ?? false, { timeout: 5_000 })
      .toBe(true);
  });
});
