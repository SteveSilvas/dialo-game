import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import { getCatalog } from '../api/catalog';
import type { Catalog, Module } from '../api/types';
import { sessionAtom } from '../state/session';
import { progressAtom } from '../state/progress';
import { applyProgress } from '../utils/progress';
import { useProgressHydration } from './useProgressHydration';

/**
 * Trilha com títulos, desbloqueio e estrelas vindos da API. Se a API não
 * responde, `status` fica `offline` e a tela cai no catálogo local.
 */
export const useCatalog = () => {
  const session = useAtomValue(sessionAtom);
  // Qualquer tela que mostra a trilha precisa do progresso que ficou no
  // aparelho: a hidratação acontece aqui, não só no `Layout`.
  useProgressHydration();
  // A fila muda a cada gravação; o catálogo em si só muda de sessão.
  const progress = useAtomValue(progressAtom);

  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'offline'>('loading');

  const reload = useCallback(async () => {
    const data = await getCatalog();
    setCatalog(data);
    setStatus('ready');
  }, []);

  useEffect(() => {
    // Espera a sessão ser restaurada: pedir o catálogo antes devolveria a
    // trilha sem progresso e a criança veria tudo bloqueado por um instante.
    if (session.status === 'loading') return;

    let cancelled = false;

    void (async () => {
      try {
        const data = await getCatalog();
        if (cancelled) return;
        setCatalog(data);
        setStatus('ready');
      } catch {
        if (cancelled) return;
        setCatalog(null);
        setStatus('offline');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session.status, session.user?.id]);

  /**
   * O servidor não conhece o progresso que ainda está no aparelho — o do
   * convidado (que é tudo) ou o da fila de envio de quem tem conta. Sem esta
   * sobreposição a trilha piscaria zerada até o `PUT` responder.
   */
  const modules = useMemo<Module[]>(
    () => (catalog ? applyProgress(catalog.modules, progress) : []),
    [catalog, progress],
  );

  return { modules, status, reload };
};
