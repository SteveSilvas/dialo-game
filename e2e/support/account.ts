import { expect, type Page } from '@playwright/test';

/** Username único por execução: o banco do E2E é recriado, mas o retry do CI não é. */
export const uniqueUsername = (prefix = 'e2e') =>
  `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`.slice(0, 20);

export const password = 'SenhaForte123';

export type Credentials = { username: string; password: string };

/** Cria a conta pela tela de cadastro, como a criança faria com um adulto. */
export const registerViaUi = async (
  page: Page,
  credentials: Credentials = { username: uniqueUsername(), password },
): Promise<Credentials> => {
  await page.goto('/entrar');
  await page.getByRole('button', { name: 'Criar uma conta' }).click();

  await page.getByLabel('Nome de usuário').fill(credentials.username);
  await page.getByLabel('Senha').fill(credentials.password);
  await page.getByRole('button', { name: 'CRIAR CONTA' }).click();

  // O cadastro redireciona para o módulo; chegar aqui é o sinal de que o
  // token foi aceito e a sessão está no estado autenticado.
  await expect(page).toHaveURL(/\/modulo-01\/?$/);
  return credentials;
};

/** `role="status"` não tira o nome do conteúdo: casa pelo texto visível. */
export const statusWithText = (page: Page, text: string | RegExp) =>
  page.getByRole('status').filter({ hasText: text });

export const loginViaUi = async (
  page: Page,
  credentials: Credentials,
): Promise<void> => {
  await page.goto('/entrar');
  await page.getByLabel('Usuário ou email').fill(credentials.username);
  await page.getByLabel('Senha').fill(credentials.password);
  await page.getByRole('button', { name: 'ENTRAR' }).click();

  await expect(page).toHaveURL(/\/modulo-01\/?$/);
};
