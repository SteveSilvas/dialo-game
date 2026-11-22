import { expect, test } from '@playwright/test';
import { isConsonant, isLetter, isNumber, isVowel, playActivity } from './support/activity';
import { password, uniqueUsername } from './support/account';
import { accessToken, readCatalog } from './support/api';
import { API_URL } from './support/env';

/**
 * Progressão da trilha. A regra de desbloqueio é do servidor
 * (`ModuleUnlockService`) e é o catálogo que a trilha consome — por isso a
 * asserção de "02 liberado, 03 bloqueado" é feita no mesmo payload que o front
 * recebe, depois de a criança concluir o módulo 01 pela interface.
 */
test.describe('progressão entre módulos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/entrar');
    await page.getByRole('button', { name: 'Criar uma conta' }).click();
    await page.getByLabel('Nome de usuário').fill(uniqueUsername('prog'));
    await page.getByLabel('Senha').fill(password);
    await page.getByRole('button', { name: 'CRIAR CONTA' }).click();
    await expect(page).toHaveURL(/\/trilha\/?$/);
  });

  test('concluir o módulo 01 libera o 02 e mantém o 03 bloqueado', async ({ page }) => {
    const before = await readCatalog(page);
    expect(before.get('modulo-01')?.status).toBe('current');
    expect(before.get('modulo-02')?.status).toBe('locked');
    expect(before.get('modulo-03')?.status).toBe('locked');

    const trail = [
      { slug: 'atividade-01', isValid: isLetter },
      { slug: 'atividade-02', isValid: isNumber },
      { slug: 'atividade-03', isValid: isVowel },
      { slug: 'atividade-04', isValid: isConsonant },
      { slug: 'atividade-05', isValid: isConsonant },
    ];

    for (const { slug, isValid } of trail) {
      await page.goto(`/modulo-01/${slug}`);
      await playActivity(page, isValid);
    }

    // Fim do módulo: a última atividade troca PRÓXIMA por CONCLUIR MÓDULO,
    // que abre a tela de conclusão com o resumo das cinco atividades.
    await page.getByRole('link', { name: 'CONCLUIR MÓDULO' }).click();
    await expect(page).toHaveURL(/\/modulo-01\/conclusao\/?$/);
    await expect(
      page.getByRole('status').filter({ hasText: /5 de 5 atividades/ }),
    ).toBeVisible({ timeout: 15_000 });

    const after = await readCatalog(page);
    expect(after.get('modulo-01')?.status).toBe('completed');
    expect(after.get('modulo-02')?.status).toBe('current');
    expect(after.get('modulo-02')?.isUnlocked).toBe(true);
    expect(after.get('modulo-03')?.status).toBe('locked');
    expect(after.get('modulo-03')?.isUnlocked).toBe(false);
  });

  test('o módulo 02 liberado aceita progresso de verdade', async ({ page }) => {
    // "Desbloqueado" só vale se o servidor aceitar a atividade: o catálogo é uma
    // promessa, e o 403 é quem a cumpre ou quebra.
    const token = await accessToken(page);
    const record = (slug: string) =>
      page.request.put(`${API_URL}/progress/activities/${slug}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { bestScore: 1, attempts: 1, errors: 0, completed: true },
      });

    expect((await record('modulo-02-atividade-01')).status()).toBe(403);

    for (const slug of [
      'atividade-01',
      'atividade-02',
      'atividade-03',
      'atividade-04',
      'atividade-05',
    ]) {
      expect((await record(slug)).status(), `progresso de ${slug}`).toBe(200);
    }

    const unlocked = await readCatalog(page);
    expect(unlocked.get('modulo-02')?.status).toBe('current');
    expect(unlocked.get('modulo-03')?.status).toBe('locked');
    expect((await record('modulo-03-atividade-01')).status()).toBe(403);

    // Concluir as cinco atividades do 02 move a corrente para o 03, o que prova
    // que o desbloqueio do 02 não foi só de fachada.
    for (const slug of [
      'modulo-02-atividade-01',
      'modulo-02-atividade-02',
      'modulo-02-atividade-03',
      'modulo-02-atividade-04',
      'modulo-02-atividade-05',
    ]) {
      expect((await record(slug)).status(), `progresso de ${slug}`).toBe(200);
    }

    const afterModuleTwo = await readCatalog(page);
    expect(afterModuleTwo.get('modulo-02')?.status).toBe('completed');
    expect(afterModuleTwo.get('modulo-03')?.status).toBe('current');
    expect((await record('modulo-03-atividade-01')).status()).toBe(200);
  });

  test('o servidor recusa progresso de módulo bloqueado', async ({ page }) => {
    const token = await accessToken(page);

    const response = await page.request.put(
      `${API_URL}/progress/activities/modulo-03-atividade-01`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: { bestScore: 1, attempts: 1, errors: 0, completed: true },
      },
    );

    expect(response.status()).toBe(403);
  });
});
