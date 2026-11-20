import { Link } from 'react-router-dom';
import { TiHome } from 'react-icons/ti';
import Trail from '../../components/Trail';
import { useCatalog } from '../../hooks/useCatalog';
import type { Module } from '../../api/types';

/** Trilha local para quando a API não responde: o jogo segue jogável. */
const FALLBACK_MODULES: Module[] = [
  {
    slug: 'modulo-01',
    title: 'Reconhecer símbolos',
    description: 'Distinguir letras, números, vogais e consoantes.',
    concept: 'Princípio alfabético',
    order: 1,
    status: 'current',
    isUnlocked: true,
    requiredTotal: 5,
    requiredCompleted: 0,
    stars: 0,
    maxStars: 15,
    activities: [
      { slug: 'atividade-01', title: 'Selecionar as letras', order: 1 },
      { slug: 'atividade-02', title: 'Selecionar os números', order: 2 },
      { slug: 'atividade-03', title: 'Selecionar as vogais', order: 3 },
      { slug: 'atividade-04', title: 'Selecionar as consoantes', order: 4 },
      { slug: 'atividade-05', title: 'Desafio das consoantes', order: 5 },
    ].map((activity) => ({
      ...activity,
      type: 'selectSymbols' as const,
      isRequired: true,
      configJson: '{}',
      progress: null,
    })),
  },
];

/**
 * Tela principal depois do login: a trilha vertical de módulos com as
 * atividades do módulo liberado em ramos abaixo do nó.
 */
const Trilha = () => {
  const { modules, status } = useCatalog();

  const ordered = [...modules].sort((a, b) => a.order - b.order);
  const trailModules = ordered.length > 0 ? ordered : FALLBACK_MODULES;

  return (
    <main className="page px-3 py-4 gap-3">
      <div className="header-page gap-2">
        <Link
          className="flex-center button min-w-0 h-12 w-12 sm:h-16 sm:w-16"
          to="/"
          aria-label="Ir para o início"
        >
          <TiHome className="text-2xl sm:text-3xl" aria-hidden="true" />
        </Link>
        <h1 className="title-ativity text-base sm:text-2xl">SUA TRILHA</h1>
      </div>

      <p className="text-center text-sm sm:text-base px-2">
        Toque no módulo para jogar as atividades dele.
      </p>

      {status === 'offline' && (
        <p className="text-center text-sm" role="status">
          Jogando sem conexão com o servidor: o progresso fica neste aparelho.
        </p>
      )}

      <Trail modules={trailModules} />
    </main>
  );
};

export default Trilha;
