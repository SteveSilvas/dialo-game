import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import { getCatalog, recordProgress } from '../api/catalog';
import { ApiError } from '../api/client';
import type { Catalog, Module } from '../api/types';
import { sessionAtom, isAuthenticated } from '../state/session';
import { readGuestProgress, saveGuestProgress } from '../state/guestProgress';
import { calculateStars, mergeBestAttempt } from '../utils/scoring';

export type ProgressReport = {
  bestScore: number;
  attempts: number;
  errors: number;
  completed: boolean;
};

const saveLocally = (activitySlug: string, report: ProgressReport) => {
  const current = readGuestProgress().find((item) => item.activitySlug === activitySlug);

  const { bestScore, errors } = mergeBestAttempt(
    current?.bestScore ?? 0,
    current?.errors ?? 0,
    report.bestScore,
    report.errors,
  );

  saveGuestProgress({
    activitySlug,
    bestScore,
    errors,
    attempts: report.attempts,
    completed: current?.completed || report.completed,
  });
};

/**
 * Registra a conclusão de uma atividade. Autenticado manda para o servidor,
 * que calcula as estrelas; sem conta (ou sem rede) grava no `localStorage`.
 */
export const useProgressReporter = () => {
  const session = useAtomValue(sessionAtom);
  const authenticated = isAuthenticated(session);

  return useCallback(
    async (activitySlug: string, report: ProgressReport) => {
      if (authenticated) {
        try {
          await recordProgress(activitySlug, report);
          return;
        } catch (error) {
          // 403 = módulo bloqueado; 404 = atividade fora do catálogo. Em ambos
          // insistir não adianta e o catálogo do servidor é que manda.
          if (error instanceof ApiError && !error.isOffline) return;
        }
      }

      saveLocally(activitySlug, report);
    },
    [authenticated],
  );
};

/**
 * Trilha com títulos, desbloqueio e estrelas vindos da API. Se a API não
 * responde, `status` fica `offline` e a tela cai no catálogo local.
 */
export const useCatalog = () => {
  const session = useAtomValue(sessionAtom);
  const authenticated = isAuthenticated(session);

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
   * No modo convidado o servidor não devolve progresso; aplicamos o que está
   * no `localStorage` sobre a trilha para desbloquear e mostrar estrelas.
   */
  const modules = useMemo<Module[]>(() => {
    if (!catalog) return [];
    if (authenticated) return catalog.modules;

    const guest = readGuestProgress();
    if (guest.length === 0) return catalog.modules;

    return catalog.modules.map((module) => {
      const activities = module.activities.map((activity) => {
        const saved = guest.find((item) => item.activitySlug === activity.slug);
        if (!saved) return activity;

        return {
          ...activity,
          progress: {
            activitySlug: activity.slug,
            bestScore: saved.bestScore,
            attempts: saved.attempts,
            errors: saved.errors,
            stars: calculateStars(saved.bestScore, saved.errors),
            completedAt: saved.completed ? new Date().toISOString() : null,
          },
        };
      });

      const required = activities.filter((activity) => activity.isRequired);

      return {
        ...module,
        activities,
        requiredCompleted: required.filter((activity) => activity.progress?.completedAt)
          .length,
        stars: activities.reduce(
          (sum, activity) => sum + (activity.progress?.stars ?? 0),
          0,
        ),
      };
    });
  }, [catalog, authenticated]);

  return { modules, status, reload };
};
