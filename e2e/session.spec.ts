import { expect, test } from '@playwright/test';
import { password, statusWithText, uniqueUsername } from './support/account';
import { readCatalog, recordProgress } from './support/api';

/**
 * O access token vive só em memória; quem mantém o login entre recarregamentos
 * é o cookie de refresh HttpOnly. Um F5 em rota interna é o caso que mais
 * quebra: se o refresh falhar, a criança volta a ser convidada e o progresso
 * "desaparece".
 */
test.describe('recarregar a página preserva a sessão', () => {
  test('F5 em rota interna mantém o login e o progresso', async ({ page }) => {
    await page.goto('/entrar');
    await page.getByRole('button', { name: 'Criar uma conta' }).click();
    const username = uniqueUsername('reload');
    await page.getByLabel('Nome de usuário').fill(username);
    await page.getByLabel('Senha').fill(password);
    await page.getByRole('button', { name: 'CRIAR CONTA' }).click();
    await expect(page).toHaveURL(/\/trilha\/?$/);

    await recordProgress(page, 'atividade-01', {
      bestScore: 8,
      attempts: 8,
      errors: 0,
      completed: true,
    });

    await page.goto('/modulo-01/atividade-02');
    await expect(page.getByRole('heading', { name: 'SELECIONE OS NÚMEROS' })).toBeVisible();

    await page.reload();

    // Continua na mesma rota, sem cair para a home nem para o 404.
    await expect(page).toHaveURL(/\/modulo-01\/atividade-02$/);
    await expect(page.getByRole('heading', { name: 'SELECIONE OS NÚMEROS' })).toBeVisible();

    // O catálogo autenticado é a prova de que a sessão sobreviveu ao reload.
    const modules = await readCatalog(page);
    expect(modules.get('modulo-01')?.requiredCompleted).toBe(1);
  });

  test('a home mostra o nome da criança depois do F5', async ({ page }) => {
    await page.goto('/entrar');
    await page.getByRole('button', { name: 'Criar uma conta' }).click();
    const username = uniqueUsername('badge');
    await page.getByLabel('Nome de usuário').fill(username);
    await page.getByLabel('Senha').fill(password);
    await page.getByRole('button', { name: 'CRIAR CONTA' }).click();
    await expect(page).toHaveURL(/\/trilha\/?$/);

    await page.goto('/');
    await expect(statusWithText(page, username)).toBeVisible();

    await page.reload();

    await expect(statusWithText(page, username)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Entrar ou criar conta' })).toHaveCount(0);
  });

  test('sem cookie de refresh, o F5 volta ao modo convidado', async ({ page }) => {
    await page.goto('/modulo-01');
    await expect(page.getByRole('heading', { name: /RECONHECER/ })).toBeVisible();

    await page.reload();

    await expect(page.getByRole('heading', { name: /RECONHECER/ })).toBeVisible();
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Entrar ou criar conta' })).toBeVisible();
  });
});
