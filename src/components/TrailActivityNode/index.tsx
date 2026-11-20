import { Link } from 'react-router-dom';
import { TiPencil, TiStarFullOutline, TiStarOutline, TiTick } from 'react-icons/ti';
import type { Activity } from '../../api/types';
import { MAX_STARS } from '../../utils/scoring';
import './index.css';

export type TrailActivityState = 'completed' | 'started' | 'pending';

export type TrailActivityNodeProps = {
  activity: Activity;
  href: string;
  /** Posição na ordem sugerida do módulo, começando em 1. */
  position: number;
};

const activityState = (activity: Activity): TrailActivityState => {
  if (activity.progress?.completedAt) return 'completed';
  if ((activity.progress?.attempts ?? 0) > 0) return 'started';
  return 'pending';
};

const describeState = (state: TrailActivityState, stars: number): string => {
  if (state === 'completed') return `Concluída, ${stars} de ${MAX_STARS} estrelas.`;
  if (state === 'started') return 'Em andamento.';
  return 'Não iniciada.';
};

/**
 * Ramo de atividade abaixo do nó do módulo. O estado aparece no ícone e na cor
 * antes do texto; as estrelas usam `aria-hidden` porque o mesmo dado já está no
 * `aria-label` — o leitor de tela não precisa ouvir "estrela" três vezes.
 */
const TrailActivityNode = ({ activity, href, position }: TrailActivityNodeProps) => {
  const state = activityState(activity);
  const stars = activity.progress?.stars ?? 0;

  const label = `Atividade ${position}: ${activity.title}. ${describeState(state, stars)}`;

  const className = `trail-activity trail-activity--${state}`;

  const content = (
    <>
      <span className="trail-activity__icon" aria-hidden="true">
        {state === 'completed' ? <TiTick /> : <TiPencil />}
      </span>

      <span className="trail-activity__order" aria-hidden="true">
        {position}
      </span>

      <span className="trail-activity__title" aria-hidden="true">
        {activity.title.toUpperCase()}
      </span>

      <span className="trail-activity__stars" aria-hidden="true">
        {Array.from({ length: MAX_STARS }, (_, index) =>
          index < stars ? (
            <TiStarFullOutline key={index} />
          ) : (
            <TiStarOutline key={index} />
          ),
        )}
      </span>
    </>
  );

  return (
    <Link
      className={className}
      to={href}
      aria-label={label}
      data-trail-node="activity"
      data-trail-activity={activity.slug}
      data-state={state}
    >
      {content}
    </Link>
  );
};

export default TrailActivityNode;
