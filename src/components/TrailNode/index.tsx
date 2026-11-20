import { Link } from 'react-router-dom';
import { TiLockClosed, TiMediaPlay, TiTick } from 'react-icons/ti';
import type { Module } from '../../api/types';
import './index.css';

export type TrailNodeProps = {
  module: Module;
  /** Destino do nó liberado; o nó bloqueado não navega. */
  href: string;
  /** Motivo do bloqueio, exibido em texto e no nome acessível. */
  lockedReason?: string;
  /** Falso para quem pediu menos movimento: o nó atual não pulsa. */
  pulse?: boolean;
};

const describeState = (
  module: Module,
  locked: boolean,
  lockedReason?: string,
): string => {
  if (locked) return `Bloqueado: ${lockedReason ?? 'conclua o módulo anterior'}.`;

  switch (module.status) {
    case 'completed':
      return `Concluído, ${module.stars} de ${module.maxStars} estrelas. Abrir módulo.`;
    case 'current':
      return `Módulo atual, ${module.requiredCompleted} de ${module.requiredTotal} atividades concluídas, ${module.stars} de ${module.maxStars} estrelas. Abrir módulo.`;
    default:
      return 'Abrir módulo.';
  }
};

const describeMeta = (module: Module): string => {
  if (module.status === 'completed') {
    return `CONCLUÍDO · ★ ${module.stars}/${module.maxStars}`;
  }
  if (module.status === 'current') {
    return `VOCÊ ESTÁ AQUI · ${module.requiredCompleted}/${module.requiredTotal} · ★ ${module.stars}/${module.maxStars}`;
  }
  return 'DISPONÍVEL';
};

/**
 * Nó de módulo da trilha. O estado é identificado primeiro pela cor e pelo
 * ícone, para a criança que ainda não lê saber onde está; o texto curto e o
 * `aria-label` completo são o complemento de quem lê e do leitor de tela.
 */
const TrailNode = ({
  module,
  href,
  lockedReason,
  pulse = false,
}: TrailNodeProps) => {
  const locked = !module.isUnlocked || module.status === 'locked';
  const label = `Módulo ${module.order}: ${module.title}. ${describeState(module, locked, lockedReason)}`;

  const className = [
    'trail-node',
    `trail-node--${locked ? 'locked' : module.status}`,
    // Só o módulo atual pulsa: nos outros estados a animação seria ruído.
    pulse && !locked && module.status === 'current' ? 'trail-node--pulse' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      <span className="trail-node__icon" aria-hidden="true">
        {locked && <TiLockClosed />}
        {!locked && module.status === 'completed' && <TiTick />}
        {!locked && module.status === 'current' && <TiMediaPlay />}
      </span>

      <span className="trail-node__body">
        <span className="trail-node__title">
          {module.order}. {module.title.toUpperCase()}
        </span>

        <span className="trail-node__meta" aria-hidden="true">
          {locked
            ? (lockedReason?.toUpperCase() ?? 'CONCLUA O MÓDULO ANTERIOR')
            : describeMeta(module)}
        </span>
      </span>
    </>
  );

  // Módulo bloqueado não vira link: o servidor recusaria o progresso com 403 e
  // a criança chegaria a uma tela que ela não pode concluir.
  if (locked) {
    return (
      <div
        className={className}
        role="group"
        aria-label={label}
        aria-disabled="true"
        data-trail-node="module"
        data-trail-module={module.slug}
        data-state={module.status}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      className={className}
      to={href}
      aria-label={label}
      data-trail-node="module"
      data-trail-module={module.slug}
      data-state={module.status}
    >
      {content}
    </Link>
  );
};

export default TrailNode;
