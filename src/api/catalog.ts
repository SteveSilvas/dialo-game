import { apiRequest } from './client';
import type { ActivityProgress, Catalog } from './types';

/**
 * O mesmo endpoint serve anônimo e autenticado: sem token devolve a trilha sem
 * progresso, que é exatamente o que o modo convidado precisa.
 */
export const getCatalog = (): Promise<Catalog> =>
  apiRequest<Catalog>('/catalog');

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
