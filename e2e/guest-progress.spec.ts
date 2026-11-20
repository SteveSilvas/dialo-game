import { expect, test } from '@playwright/test';
import { isLetter, playActivity } from './support/activity';
import { password, statusWithText, uniqueUsername } from './support/account';
import { readCatalog } from './support/api';

/**
 * Fluxo crítico de conversão: quem jogou sem conta precisa encontrar o
 * progresso depois de criar uma. É o único caminho em que o `localStorage`
 * cruza a fronteira do login (`POST /progress/import`).
 */
test.describe('visitante joga, cria conta e mantém o progresso', () => {
  test('importa o progresso do convidado ao criar a conta', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'INICIAR' }).click();
    await expect(page).toHaveURL(/\/modulo-01\/?$/);

    await page.getByRole('link', { name: /LETRAS/i }).click();
    await expect(page).toHaveURL(/\/modulo-01\/atividade-01$/);

    await playActivity(page, isLetter);

    const guestProgress = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('dialo:guest-progress:v1') ?? '[]'),
    );
    expect(guestProgress).toHaveLength(1);
    expect(guestProgress[0]).toMatchObject({
      activitySlug: 'atividade-01',
      completed: true,
    });

    const username = uniqueUsername('guest');
    await page.goto('/entrar');
    await page.getByRole('button', { name: 'Criar uma conta' }).click();
    await page.getByLabel('Nome de usuário').fill(username);
    await page.getByLabel('Senha').fill(password);
    await page.getByRole('button', { name: 'CRIAR CONTA' }).click();

    await expect(page).toHaveURL(/\/modulo-01\/?$/);
    await page.goto('/');
    await expect(statusWithText(page, new RegExp(username))).toBeVisible();

    // O progresso local só é limpo quando a API aceita o envio.
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('dialo:guest-progress:v1')), {
        message: 'progresso local limpo depois da importação',
        timeout: 15_000,
      })
      .toBeNull();

    const modules = await readCatalog(page);
    expect(modules.get('modulo-01')?.requiredCompleted).toBe(1);
  });

  test('a trilha já abre com o progresso importado, sem precisar recarregar', async ({
    page,
  }) => {
    await page.goto('/modulo-01/atividade-01');
    await playActivity(page, isLetter);

    await page.goto('/entrar');
    await page.getByRole('button', { name: 'Criar uma conta' }).click();
    await page.getByLabel('Nome de usuário').fill(uniqueUsername('trail'));
    await page.getByLabel('Senha').fill(password);
    await page.getByRole('button', { name: 'CRIAR CONTA' }).click();

    // Sem reload: a importação roda antes da sessão virar autenticada, então o
    // primeiro catálogo buscado já vem com o progresso.
    await expect(page).toHaveURL(/\/modulo-01\/?$/);
    await expect(statusWithText(page, /1\/5 atividades concluídas/)).toBeVisible({
      timeout: 15_000,
    });

    // A trilha mostra o total de estrelas do módulo; o que importa aqui é que
    // as 3 estrelas da atividade importada já estejam contadas.
    await expect(statusWithText(page, /\b3 de \d+ estrelas/)).toBeVisible();
  });
});
