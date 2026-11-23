import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { Module } from '../../api/types';
import TrailNode from '../TrailNode';
import TrailActivityNode from '../TrailActivityNode';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { activityPath, modulePath } from '../../utils/paths';
import { buildTrailPath, type TrailBox, type TrailSegment } from './path';
import './index.css';

export type TrailProps = {
  /** Módulos na ordem da trilha. A ordem de exibição é `module.order`. */
  modules: Module[];
  /** Destino de um módulo. Por padrão `modulePath(slug)`. */
  moduleHref?: (module: Module) => string;
  /** Destino de uma atividade. Por padrão `activityPath(slug, activitySlug)`. */
  activityHref?: (module: Module, activitySlug: string) => string;
  /** Centraliza o módulo atual ao abrir. */
  autoScroll?: boolean;
};

const defaultModuleHref = (module: Module) => modulePath(module.slug);
const defaultActivityHref = (module: Module, activitySlug: string) =>
  activityPath(module.slug, activitySlug);

const toBox = (element: Element, origin: DOMRect): TrailBox => {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top - origin.top,
    bottom: rect.bottom - origin.top,
    left: rect.left - origin.left,
    centerX: rect.left - origin.left + rect.width / 2,
  };
};

/**
 * Trilha vertical: cada módulo é um nó grande no caminho, e as atividades do
 * módulo liberado abrem em ramos menores logo abaixo dele.
 *
 * O SVG do caminho é decorativo (`aria-hidden`), porque o estado de cada nó
 * também está na cor, no ícone e no `aria-label` do link.
 */
const Trail = ({
  modules,
  moduleHref = defaultModuleHref,
  activityHref = defaultActivityHref,
  autoScroll = true,
}: TrailProps) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const currentRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion = useReducedMotion();

  const [geometry, setGeometry] = useState({ d: '', width: 0, height: 0 });

  const ordered = useMemo(
    () => [...modules].sort((a, b) => a.order - b.order),
    [modules],
  );
  const currentSlug = ordered.find((module) => module.status === 'current')?.slug ?? null;

  const measure = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const origin = stage.getBoundingClientRect();
    const segments: TrailSegment[] = Array.from(
      stage.querySelectorAll<HTMLElement>('[data-trail-item]'),
    ).flatMap((item) => {
      const node = item.querySelector('[data-trail-node="module"]');
      if (!node) return [];

      return [
        {
          node: toBox(node, origin),
          activities: Array.from(
            item.querySelectorAll('[data-trail-node="activity"]'),
          ).map((activity) => toBox(activity, origin)),
        },
      ];
    });

    const next = {
      d: buildTrailPath(segments),
      width: Math.round(origin.width),
      height: Math.round(origin.height),
    };

    // Comparar antes de gravar evita re-render em laço quando o observer
    // dispara de novo com a mesma medida.
    setGeometry((previous) =>
      previous.d === next.d &&
      previous.width === next.width &&
      previous.height === next.height
        ? previous
        : next,
    );
  }, []);

  useLayoutEffect(() => {
    measure();
  }, [measure, ordered]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    // A altura muda com a fonte, com a largura e quando as atividades chegam:
    // medir de novo evita caminho torto ou cortado.
    window.addEventListener('resize', measure);

    const observer =
      typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    observer?.observe(stage);

    // A fonte da web troca a altura dos títulos depois do primeiro paint.
    document.fonts?.ready.then(measure).catch(() => undefined);

    return () => {
      window.removeEventListener('resize', measure);
      observer?.disconnect();
    };
  }, [measure]);

  useEffect(() => {
    if (!autoScroll) return;

    const node = currentRef.current;
    if (!node || typeof node.scrollIntoView !== 'function') return;

    node.scrollIntoView({
      block: 'center',
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  }, [autoScroll, currentSlug, reducedMotion]);

  const lockedReasonFor = (index: number) => {
    const previous = ordered[index - 1];
    return previous
      ? `Conclua o módulo ${previous.order}: ${previous.title}`
      : 'Conclua o módulo anterior';
  };

  return (
    <nav className="trail" aria-label="Trilha de módulos">
      <div className="trail__stage" ref={stageRef}>
        <svg
          className="trail__path"
          aria-hidden="true"
          focusable="false"
          width={geometry.width || undefined}
          height={geometry.height || undefined}
          viewBox={
            geometry.width > 0 && geometry.height > 0
              ? `0 0 ${geometry.width} ${geometry.height}`
              : undefined
          }
        >
          <path d={geometry.d} fill="none" />
        </svg>

        <ol className="trail__list">
          {ordered.map((module, index) => {
            const unlocked = module.isUnlocked && module.status !== 'locked';
            const activities = [...module.activities].sort((a, b) => a.order - b.order);

            return (
              <li className="trail__item" key={module.slug} data-trail-item>
                <div
                  className="trail__node"
                  ref={module.slug === currentSlug ? currentRef : undefined}
                >
                  <TrailNode
                    module={module}
                    href={moduleHref(module)}
                    lockedReason={unlocked ? undefined : lockedReasonFor(index)}
                    pulse={!reducedMotion}
                  />
                </div>

                {unlocked && activities.length > 0 && (
                  <ul className="trail__branches">
                    {activities.map((activity, position) => (
                      <li className="trail__branch" key={activity.slug}>
                        <TrailActivityNode
                          activity={activity}
                          position={position + 1}
                          href={activityHref(module, activity.slug)}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
};

export default Trail;
