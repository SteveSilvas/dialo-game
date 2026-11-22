import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import BuildWordActivity from '../../components/BuildWordActivity';
import { getCatalog } from '../../api/catalog';
import type { Activity, Module } from '../../api/types';
import { parseActivityConfig, canRenderConfig } from '../../utils/activityConfig';
import { modulePath, TRAIL_PATH } from '../../utils/paths';
import './index.css';

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; module: Module; activity: Activity }
  | { status: 'unavailable'; reason: string };

const byOrder = <T extends { order: number }>(items: readonly T[]): T[] =>
  [...items].sort((a, b) => a.order - b.order);

/**
 * Tela de atividade genérica: a API diz o `type` e o `configJson`, e esta página
 * escolhe o componente. Módulo novo entra no catálogo e já abre aqui, sem rota
 * nem componente por módulo.
 */
const ActivityPage = () => {
  const { moduleSlug = '', activitySlug = '' } = useParams();
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const catalog = await getCatalog();
        if (cancelled) return;

        const foundModule = catalog.modules.find((m) => m.slug === moduleSlug);
        const foundActivity = foundModule?.activities.find(
          (a) => a.slug === activitySlug,
        );

        if (!foundModule || !foundActivity) {
          setState({
            status: 'unavailable',
            reason: 'Essa atividade não está no catálogo.',
          });
          return;
        }

        setState({ status: 'ready', module: foundModule, activity: foundActivity });
      } catch {
        if (cancelled) return;
        setState({
          status: 'unavailable',
          reason: 'Não foi possível carregar a atividade agora.',
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [moduleSlug, activitySlug]);

  const config = useMemo(
    () => (state.status === 'ready' ? parseActivityConfig(state.activity) : null),
    [state],
  );

  if (state.status === 'loading') {
    return (
      <main className="page px-4 py-6">
        <p role="status">Carregando atividade…</p>
      </main>
    );
  }

  if (state.status === 'unavailable' || !config || !canRenderConfig(config)) {
    const reason =
      state.status === 'unavailable'
        ? state.reason
        : config?.kind === 'unsupported'
          ? `Esta atividade ainda não está pronta (${config.reason}).`
          : 'Esta atividade ainda não está pronta.';

    return (
      <main className="page px-4 py-6">
        <div className="activity-unavailable">
          <h1 className="text-lg sm:text-2xl">ATIVIDADE INDISPONÍVEL</h1>
          <p className="text-sm sm:text-base" role="status">
            {reason}
          </p>
          <Link className="activity-unavailable__link" to={moduleSlug ? modulePath(moduleSlug) : TRAIL_PATH}>
            VOLTAR PARA O MÓDULO
          </Link>
        </div>
      </main>
    );
  }

  const { module, activity } = state;
  const activities = byOrder(module.activities);
  const position = activities.findIndex((a) => a.slug === activity.slug);
  const next = position >= 0 ? activities[position + 1] : undefined;
  const nextHref = next ? `${modulePath(module.slug)}/${next.slug}` : undefined;

  if (config.kind === 'buildWord') {
    return (
      <BuildWordActivity
        moduleSlug={module.slug}
        activitySlug={activity.slug}
        nextHref={nextHref}
        backHref={modulePath(module.slug)}
        config={config}
      />
    );
  }

  return null;
};

export default ActivityPage;
