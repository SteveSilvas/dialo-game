import { expect, test } from '@playwright/test';
import { isLetter } from './support/activity';
import { expectNoA11yViolations } from './support/a11y';
import { password, uniqueUsername } from './support/account';

/**
 * Auditoria axe nas telas principais, com a mesma build que vai para produção.
 * Rodar sobre telas em estados diferentes importa: a grade de símbolos só
 * existe durante a partida, e a tela de erro só depois de um login inválido.
 */
test.describe('acessibilidade (axe, WCAG 2.1 AA)', () => {
  test('capa', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'VAMOS APRENDER?' })).toBeVisible();

    await expectNoA11yViolations(page, { screen: 'capa' });
  });

  test('entrada e cadastro', async ({ page }) => {
    await page.goto('/entrar');
    await expect(page.getByRole('heading', { name: 'ENTRAR' })).toBeVisible();
    await expectNoA11yViolations(page, { screen: 'entrar' });

    await page.getByRole('button', { name: 'Criar uma conta' }).click();
    await expect(page.getByRole('heading', { name: 'CRIAR CONTA' })).toBeVisible();
    await expectNoA11yViolations(page, { screen: 'cadastro' });
  });

  test('home do módulo', async ({ page }) => {
    await page.goto('/modulo-01');
    await expect(page.getByRole('heading', { name: /RECONHECER/ })).toBeVisible();

    await expectNoA11yViolations(page, { screen: 'home do módulo' });
  });

  test('atividade em andamento e concluída', async ({ page }) => {
    await page.goto('/modulo-01/atividade-01');
    await expect(page.getByRole('group', { name: 'Símbolos da atividade' })).toBeVisible();

    await expectNoA11yViolations(page, { screen: 'atividade 01 em andamento' });

    const grid = page.getByRole('group', { name: 'Símbolos da atividade' });
    const targets = (await grid.getByRole('button').allInnerTexts())
      .map((label) => label.trim())
      .filter((label) => isLetter(label.toLowerCase()));

    for (const target of targets) {
      await grid.getByRole('button', { name: target.toUpperCase(), exact: true }).click();
    }

    await expect(page.getByRole('link', { name: 'PRÓXIMA' })).toBeVisible({
      timeout: 20_000,
    });

    await expectNoA11yViolations(page, { screen: 'atividade 01 concluída' });
  });

  test('atividade 05 (arrastar e soltar)', async ({ page }) => {
    await page.goto('/modulo-01/atividade-05');
    await expect(page.getByRole('heading', { name: 'GUARDE AS LETRAS NA CAIXA' })).toBeVisible();

    await expectNoA11yViolations(page, { screen: 'atividade 05' });
  });

  test('erro de login anunciado', async ({ page }) => {
    await page.goto('/entrar');
    await page.getByLabel('Usuário ou email').fill('nao-existe');
    await page.getByLabel('Senha').fill(password);
    await page.getByRole('button', { name: 'ENTRAR' }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expectNoA11yViolations(page, { screen: 'entrar com erro' });
  });

  test('conta logada na capa', async ({ page }) => {
    await page.goto('/entrar');
    await page.getByRole('button', { name: 'Criar uma conta' }).click();
    await page.getByLabel('Nome de usuário').fill(uniqueUsername('axe'));
    await page.getByLabel('Senha').fill(password);
    await page.getByRole('button', { name: 'CRIAR CONTA' }).click();
    await expect(page).toHaveURL(/\/modulo-01\/?$/);

    await page.goto('/');
    await expect(page.getByRole('status')).toBeVisible();
    await expectNoA11yViolations(page, { screen: 'capa com conta' });
  });

  test('404', async ({ page }) => {
    await page.goto('/rota-que-nao-existe');
    await expect(page.getByRole('heading', { name: 'PÁGINA NÃO ENCONTRADA' })).toBeVisible();

    await expectNoA11yViolations(page, { screen: '404' });
  });
});
