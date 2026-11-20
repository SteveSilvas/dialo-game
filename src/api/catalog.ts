import { ApiError, apiRequest } from './client';
import type { ActivityProgress, Catalog } from './types';

/**
 * O mesmo endpoint serve anônimo e autenticado: sem token devolve a trilha sem
 * progresso, que é exatamente o que o modo convidado precisa.
 *
 * A resposta é validada porque um 200 nem sempre é o catálogo: sem
 * `VITE_API_URL` a chamada relativa cai no fallback de SPA do host, que devolve
 * o `index.html`. Sem esta checagem `catalog.modules` seria `undefined` e a
 * trilha quebraria em vez de cair no modo offline.
 */
export const getCatalog = async (): Promise<Catalog> => {
  const data = await apiRequest<Catalog>('/catalog');

  if (!data || !Array.isArray(data.modules)) {
    throw new ApiError(0, 'O servidor não devolveu o catálogo.');
  }

  return data;
};

export const recordProgress = (
  activitySlug: string,
  input: { bestScore: number; attempts: number; errors: number; completed: boolean },
): Promise<ActivityProgress> =>
  apiRequest<ActivityProgress>(`/progress/activities/${activitySlug}`, {
    method: 'PUT',
    body: input,
  });

export const importProgress = (
  items: Array<{
    activitySlug: string;
    bestScore: number;
    attempts: number;
    errors: number;
    completed: boolean;
  }>,
): Promise<{ imported: number }> =>
  apiRequest<{ imported: number }>('/progress/import', {
    method: 'POST',
    body: { items },
  });
