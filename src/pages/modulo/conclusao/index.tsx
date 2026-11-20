import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { useLocation, useParams } from 'react-router-dom';
import { TiArrowLeftThick, TiArrowRightThick, TiHome } from 'react-icons/ti';
import BoxRow from '../../../components/BoxRow';
import CustomButton from '../../../components/Button';
import LabelValue from '../../../components/LabelValue';
import { useCatalog } from '../../../hooks/useCatalog';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { progressAtom } from '../../../state/progress';
import { useProgressHydration } from '../../../hooks/useProgressHydration';
import { localModule } from '../../../state/localTrail';
import {
  findNextModule,
  summarizeGuestModule,
  summarizeModule,
  type ActivityResult,
  type ModuleSummary,
} from '../../../utils/moduleSummary';
import { modulePath } from '../../../utils/paths';
import './index.css';

/** Resultado repassado pela última atividade, ainda não confirmado pela API. */
type ConclusionState = { lastResult?: ActivityResult } | null;

const Stars = ({ stars, max }: { stars: number; max: number }) => (
  <span
    className="activity-stars celebration-stars"
    role="img"
    aria-label={`${stars} de ${max} estrelas`}
  >
    {'★'.repeat(Math.max(stars, 0))}
    {'☆'.repeat(Math.max(max - stars, 0))}
  </span>
);

interface ModuleConclusionProps {
  /** Módulo concluído; a rota genérica informa pelo parâmetro. */
  moduleSlug?: string;
}

/**
 * Fechamento do módulo: parabéns, estrelas e resumo do que a criança fez.
 * Nunca bloqueia: a trilha e o início continuam a um toque, e o próximo módulo
 * só aparece quando já está liberado. Aberta antes da hora (link direto), a
 * tela diz quanto falta em vez de dar os parabéns por engano.
 */
const ModuleConclusion = ({ moduleSlug = 'modulo-01' }: ModuleConclusionProps) => {
  const params = useParams();
  const slug = params.moduleSlug ?? moduleSlug;

  const { state } = useLocation();
  const lastResult = (state as ConclusionState)?.lastResult;

  const { modules, status } = useCatalog();
  useProgressHydration();
  const progress = useAtomValue(progressAtom);
  const module = modules.find((item) => item.slug === slug);
  const local = localModule(slug);
  const reducedMotion = useReducedMotion();

  const summary = useMemo<ModuleSummary | null>(() => {
    if (module) return summarizeModule(module, lastResult);

    // Enquanto o catálogo carrega não há o que resumir: mostrar zeros para quem
    // tem conta daria um susto antes de as estrelas do servidor chegarem.
    if (status === 'loading') return null;

    // Sem catálogo (API fora do ar): o resumo sai da trilha local e do
    // progresso guardado no aparelho.
    const slugs = (local?.activities ?? []).map((activity) => activity.slug);
    return slugs.length > 0
      ? summarizeGuestModule(slugs, Object.values(progress))
      : null;
  }, [module, lastResult, local, status, progress]);

  const isComplete = summary?.isComplete ?? false;
  const remaining = summary ? summary.total - summary.completed : 0;

  const nextModule = module ? findNextModule(modules, module) : undefined;
  // O catálogo desta tela pode ter sido carregado antes de o servidor registrar
  // a última atividade. Nesse caso o módulo ainda aparece incompleto, mas o
  // resumo local já o fecha: o próximo módulo está liberado de fato. Quando o
  // servidor já marcou este módulo como concluído, vale o que ele diz sobre o
  // próximo.
  const catalogIsStale = Boolean(
    module && module.requiredCompleted < module.requiredTotal,
  );
  const nextUnlocked = Boolean(
    nextModule &&
      (nextModule.isUnlocked || (catalogIsStale && summary?.isComplete)),
  );

  const moduleTitle = module?.title ?? local?.title;

  return (
    <main className="page px-4 py-6 gap-3">
      <h1 className="text-xl sm:text-3xl md:text-4xl text-center">
        {isComplete ? 'PARABÉNS!' : 'AINDA FALTA POUCO!'}
      </h1>

      <p className="text-center px-2 text-sm sm:text-base">
        {isComplete
          ? moduleTitle
            ? `Você concluiu o módulo “${moduleTitle}”.`
            : 'Você concluiu mais um módulo.'
          : `Faltam ${remaining} ${remaining === 1 ? 'atividade' : 'atividades'} para fechar o módulo.`}
      </p>

      {isComplete && (
        <div
          className={`celebration${reducedMotion ? '' : ' celebration--animated'}`}
          aria-hidden="true"
        >
          <span className="celebration-star">★</span>
          <span className="celebration-star">★</span>
          <span className="celebration-star">★</span>
        </div>
      )}

      <p className="text-center text-sm" role="status" aria-live="polite">
        {summary
          ? `${isComplete ? 'Módulo concluído' : 'Resumo do módulo'}: ` +
            `${summary.stars} de ${summary.maxStars} estrelas, ` +
            `${summary.hits} acertos e ${summary.errors} erros em ` +
            `${summary.completed} de ${summary.total} atividades.`
          : isComplete
            ? 'Módulo concluído.'
            : 'Carregando o resumo do módulo.'}
      </p>

      {summary && (
        <BoxRow gap="4px" justifyContent="center">
          <LabelValue text="ACERTOS" value={summary.hits.toString()} type="hits" />
          <LabelValue text="ERROS" value={summary.errors.toString()} type="errors" />
          <LabelValue
            text="ATIVIDADES"
            value={`${summary.completed}/${summary.total}`}
          />
        </BoxRow>
      )}

      {summary && (
        <div className="flex flex-col items-center gap-1">
          <Stars stars={summary.stars} max={summary.maxStars} />
          <p className="text-sm">
            {summary.stars} de {summary.maxStars} estrelas no módulo
          </p>
        </div>
      )}

      <BoxRow justifyContent="center" width="100%" gap="0.5rem">
        <CustomButton
          href="/"
          ariaLabel="Ir para o início"
          leftIcon={<TiHome className="text-2xl sm:text-3xl" style={{ color: 'var(--ink)' }} />}
        />
        <CustomButton
          text="VOLTAR À TRILHA"
          href={modulePath(slug)}
          leftIcon={
            <TiArrowLeftThick
              className="text-2xl sm:text-3xl"
              style={{ left: '0.5rem', color: 'var(--ink)' }}
            />
          }
        />
        {nextUnlocked && nextModule && (
          <CustomButton
            text="PRÓXIMO MÓDULO"
            href={modulePath(nextModule.slug)}
            rightIcon={
              <TiArrowRightThick
                className="text-2xl sm:text-3xl"
                style={{ color: 'var(--ink)' }}
              />
            }
          />
        )}
      </BoxRow>

      {nextModule && !nextUnlocked && (
        <p className="text-center text-sm">
          O próximo módulo abre quando este estiver completo. Você pode voltar à
          trilha quando quiser.
        </p>
      )}
    </main>
  );
};

export default ModuleConclusion;
