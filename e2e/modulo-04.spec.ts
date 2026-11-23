import { expect, test } from '@playwright/test';
import { password, uniqueUsername } from './support/account';
import { readCatalog, recordProgress } from './support/api';

/**
 * Módulo 04 — "Formar palavras".
 *
 * O que só o navegador prova: a tela genérica escolhe o componente pelo `type`
 * que vem da API, a palavra aparece com um buraco, o distrator é rejeitado sem
 * encerrar a atividade, e a sílaba certa fecha a palavra. Teste de componente
 * cobre o componente; aqui se cobre a costura catálogo → parser → tela.
 */
test.describe('módulo 04 — formar palavras', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/entrar');
    await page.getByRole('button', { name: 'Criar uma conta' }).click();
    await page.getByLabel('Nome de usuário').fill(uniqueUsername('m04'));
    await page.getByLabel('Senha').fill(password);
    await page.getByRole('button', { name: 'CRIAR CONTA' }).click();
    await expect(page).toHaveURL(/\/trilha\/?$/);
  });

  /** Prepara o cenário: módulos 01 a 03 concluídos, 04 liberado. */
  const unlockModule04 = async (page: Parameters<typeof readCatalog>[0]) => {
    for (const slug of [
      'atividade-01',
      'atividade-02',
      'atividade-03',
      'atividade-04',
      'atividade-05',
      'modulo-02-atividade-01',
      'modulo-02-atividade-02',
      'modulo-02-atividade-03',
      'modulo-02-atividade-04',
      'modulo-02-atividade-05',
      'modulo-03-atividade-01',
      'modulo-03-atividade-02',
      'modulo-03-atividade-03',
      'modulo-03-atividade-04',
      'modulo-03-atividade-05',
    ]) {
      await recordProgress(page, slug, {
        bestScore: 1,
        attempts: 1,
        errors: 0,
        completed: true,
      });
    }
  };

  test('o módulo 04 só abre depois do 03 e aceita progresso', async ({ page }) => {
    const before = await readCatalog(page);
    expect(before.get('modulo-04')?.status).toBe('locked');
    expect(before.get('modulo-04')?.isUnlocked).toBe(false);

    await unlockModule04(page);

    const after = await readCatalog(page);
    expect(after.get('modulo-03')?.status).toBe('completed');
    expect(after.get('modulo-04')?.status).toBe('current');
    expect(after.get('modulo-04')?.isUnlocked).toBe(true);
  });

  test('completar a sílaba que falta encerra a atividade', async ({ page }) => {
    await unlockModule04(page);

    await page.goto('/modulo/modulo-04/modulo-04-atividade-01');
    await expect(page.getByRole('heading', { name: 'QUAL SÍLABA FALTA?' })).toBeVisible();

    // A palavra aparece com um buraco: duas de três sílabas visíveis, uma em '?'.
    await expect(
      page.getByRole('status', { name: /Palavra incompleta: falta a sílaba 1/ }),
    ).toBeVisible();

    const options = page.getByRole('group', { name: 'Sílabas disponíveis' });
    await expect(options.getByRole('button')).toHaveCount(3);

    // "JA" é a primeira sílaba de JANELA; "JE" e "JO" são os distratores.
    await options.getByRole('button', { name: 'Sílaba JE', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('não forma a palavra');
    // O erro não encerra a atividade, mas as opções ficam travadas durante o
    // retorno; depois disso a criança pode tentar de novo.
    await expect(
      options.getByRole('button', { name: 'Sílaba JA', exact: true }),
    ).toBeEnabled({ timeout: 5_000 });

    await options.getByRole('button', { name: 'Sílaba JA', exact: true }).click();

    // O nome acessível descreve o estado; o texto visível são as sílabas.
    await expect(
      page.getByRole('status', { name: 'Palavra completa: JANELA' }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /^(PRÓXIMA|CONCLUIR MÓDULO)$/ }),
    ).toBeVisible({ timeout: 20_000 });
  });

  test('a última atividade conclui o módulo', async ({ page }) => {
    await unlockModule04(page);

    // Concluir o módulo exige as cinco: a tela de conclusão conta o que foi
    // registrado, então as quatro primeiras entram pela API e a última pela UI.
    for (const slug of [
      'modulo-04-atividade-01',
      'modulo-04-atividade-02',
      'modulo-04-atividade-03',
      'modulo-04-atividade-04',
    ]) {
      await recordProgress(page, slug, {
        bestScore: 1,
        attempts: 1,
        errors: 0,
        completed: true,
      });
    }

    await page.goto('/modulo/modulo-04/modulo-04-atividade-05');
    const options = page.getByRole('group', { name: 'Sílabas disponíveis' });
    await options.getByRole('button', { name: 'Sílaba RU', exact: true }).click();

    await page.getByRole('link', { name: 'CONCLUIR MÓDULO' }).click();
    await expect(page).toHaveURL(/\/modulo\/modulo-04\/conclusao\/?$/);
    await expect(
      page.getByRole('status').filter({ hasText: /5 de 5 atividades/ }),
    ).toBeVisible({ timeout: 15_000 });

    const catalog = await readCatalog(page);
    expect(catalog.get('modulo-04')?.status).toBe('completed');
  });
});

test('o estado não vaza ao navegar entre atividades do módulo', async ({ page }) => {
  await page.goto('/modulo/modulo-04/modulo-04-atividade-01');

  // erra uma vez para deixar o painel sujo antes de navegar
  await page.getByRole('button', { name: 'Sílaba JE', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await page.waitForTimeout(1100);
  await page.getByRole('button', { name: 'Sílaba JA', exact: true }).click();
  await expect(page.getByRole('status', { name: 'Palavra completa: JANELA' })).toBeVisible();

  await page.getByRole('link', { name: 'PRÓXIMA' }).click();
  await expect(page.getByRole('status', { name: 'Palavra incompleta: falta a sílaba 2' })).toBeVisible();

  // Sem remontagem por atividade, o painel continua contando erros da anterior
  // e o progresso da nova atividade nunca é reportado.
  const erros = page.getByText('ERROS').locator('xpath=preceding-sibling::*[1]');
  const tentativas = page.getByText('TENTATIVAS').locator('xpath=preceding-sibling::*[1]');
  await expect(erros).toHaveText('0');
  await expect(tentativas).toHaveText('0');
});
