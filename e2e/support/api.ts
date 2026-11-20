import { expect, type Page } from '@playwright/test';
import { API_URL } from './env';

export type ModuleStatus = 'locked' | 'current' | 'completed';

export type ModuleSnapshot = {
  slug: string;
  title: string;
  status: ModuleStatus;
  isUnlocked: boolean;
  requiredCompleted: number;
  requiredTotal: number;
  stars: number;
};

/**
 * Renova o token usando o cookie de refresh que o navegador já tem. É o mesmo
 * caminho de um F5: o access token vive em memória, então a única prova de
 * sessão que o teste pode reaproveitar é o cookie HttpOnly.
 */
export const accessToken = async (page: Page): Promise<string> => {
  const response = await page.request.post(`${API_URL}/auth/refresh`);
  expect(response.status(), 'refresh com o cookie da sessão').toBe(200);

  const body = (await response.json()) as { accessToken: string };
  return body.accessToken;
};

/**
 * Lê a trilha exatamente como a criança logada recebe. A home do módulo hoje só
 * renderiza o `modulo-01`, então o desbloqueio do módulo 02 e o bloqueio do 03
 * são verificados neste contrato — a mesma resposta que a trilha consome.
 */
export const readCatalog = async (page: Page): Promise<Map<string, ModuleSnapshot>> => {
  const token = await accessToken(page);

  const response = await page.request.get(`${API_URL}/catalog`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.status(), 'catálogo autenticado').toBe(200);

  const body = (await response.json()) as { modules: ModuleSnapshot[] };
  return new Map(body.modules.map((module) => [module.slug, module]));
};

/** Registra o progresso de uma atividade direto na API, para preparar cenário. */
export const recordProgress = async (
  page: Page,
  activitySlug: string,
  result: { bestScore: number; attempts: number; errors: number; completed: boolean },
): Promise<void> => {
  const token = await accessToken(page);

  const response = await page.request.put(`${API_URL}/progress/activities/${activitySlug}`, {
    headers: { Authorization: `Bearer ${token}` },
    data: result,
  });
  expect(response.status(), `progresso de ${activitySlug}`).toBe(200);
};
