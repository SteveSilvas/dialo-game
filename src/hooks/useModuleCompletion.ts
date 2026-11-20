import { useEffect, useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import { getCatalog } from '../api/catalog';
import type { Catalog } from '../api/types';
import { progressAtom } from '../state/progress';
import { localModule } from '../state/localTrail';
import { applyProgress } from '../utils/progress';
import { useProgressHydration } from './useProgressHydration';
import {
  findNextModule,
  summarizeGuestModule,
  summarizeModule,
  type ActivityResult,
} from '../utils/moduleSummary';

export type ModuleCompletion = {
  /** `false` enquanto o catálogo da checagem ainda não chegou. */
  ready: boolean;
  complete: boolean;
  nextModuleSlug?: string;
};

/**
 * Depois que a criança termina uma atividade, decide se o módulo fechou e qual
 * é o próximo. O catálogo só é buscado nesse momento: as atividades não
 * precisam de uma requisição extra enquanto a criança está jogando.
 *
 * `result` é o que a criança acabou de fazer. Ele entra no resumo pelo
 * `mergeBestAttempt`, então a checagem vale mesmo se a API ainda não tiver
 * devolvido o progresso recém-registrado.
 */
export const useModuleCompletion = (
  moduleSlug: string,
  result: ActivityResult | null,
): ModuleCompletion => {
  useProgressHydration();
  const progress = useAtomValue(progressAtom);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (!result) return;

    let cancelled = false;

    void (async () => {
      try {
        const data = await getCatalog();
        if (cancelled) return;
        setCatalog(data);
        setOffline(false);
      } catch {
        if (cancelled) return;
        setCatalog(null);
        setOffline(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [result]);

  return useMemo<ModuleCompletion>(() => {
    if (!result) return { ready: false, complete: false };

    if (catalog) {
      // O servidor não conhece o que ainda está no aparelho: sem este merge a
      // checagem leria tudo zerado e o módulo nunca fecharia.
      const modules = applyProgress(catalog.modules, progress);
      const module = modules.find((item) => item.slug === moduleSlug);
      if (!module) return { ready: true, complete: false };

      return {
        ready: true,
        complete: summarizeModule(module, result).isComplete,
        nextModuleSlug: findNextModule(modules, module)?.slug,
      };
    }

    if (offline) {
      const slugs = (localModule(moduleSlug)?.activities ?? []).map(
        (activity) => activity.slug,
      );

      return {
        ready: true,
        complete: summarizeGuestModule(slugs, Object.values(progress), result)
          .isComplete,
      };
    }

    return { ready: false, complete: false };
  }, [catalog, offline, moduleSlug, progress, result]);
};
