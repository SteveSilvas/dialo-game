import { useCallback } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import type { ActivityProgressInput } from '../api/types';
import { isAuthenticated, sessionAtom } from '../state/session';
import { flushProgressAtom, reportProgressAtom } from '../state/progress';

/**
 * Registra a conclusão de uma atividade. A gravação é otimista: o progresso
 * vale no aparelho antes de o servidor responder e entra na fila de envio.
 *
 * Com conta, a fila sobe em seguida — e se a rede falhar, o registro fica no
 * `localStorage` e `useProgressSync` tenta de novo. Sem conta, a fila é o
 * próprio progresso.
 */
export const useProgressReporter = () => {
  const session = useAtomValue(sessionAtom);
  const authenticated = isAuthenticated(session);
  const report = useSetAtom(reportProgressAtom);
  const flush = useSetAtom(flushProgressAtom);

  return useCallback(
    (activitySlug: string, input: ActivityProgressInput) => {
      report({ activitySlug, report: input, sync: authenticated });

      if (authenticated) void flush();
    },
    [authenticated, flush, report],
  );
};
