import { useState } from 'react';
import { TiArrowLeftThick, TiArrowRightThick, TiHome, TiRefresh } from 'react-icons/ti';
import BoxRow from '../BoxRow';
import CustomButton from '../Button';
import PanelPoints from '../PanelPoints';
import SymbolsGrid from '../SymbolsGrid';
import { useActivityProgress } from '../../hooks/useActivityProgress';
import { useModuleCompletion } from '../../hooks/useModuleCompletion';
import { useProgressReporter } from '../../hooks/useProgressReporter';
import type { ActivityResult } from '../../utils/moduleSummary';
import { conclusionPath } from '../../utils/paths';
import './index.css';

interface ActivityGridProps {
  /** Slug na API (`atividade-01`), usado para registrar o progresso. */
  activitySlug: string;
  title: string;
  buildOptions: () => string[];
  isValid: (option: string) => boolean;
  backHref: string;
  nextHref: string;
  /** Módulo dono da atividade, para fechar o módulo quando ela for a última. */
  moduleSlug?: string;
}

/**
 * Estrutura comum às atividades de seleção do módulo 01 (01 a 04):
 * painel de pontos, grade de símbolos, botões de navegação e conclusão.
 */
const ActivityGrid = ({
  activitySlug,
  title,
  buildOptions,
  isValid,
  backHref,
  nextHref,
  moduleSlug = 'modulo-01',
}: ActivityGridProps) => {
  const reportProgress = useProgressReporter();
  const [lastResult, setLastResult] = useState<ActivityResult | null>(null);

  const {
    options,
    optionsFound,
    removing,
    clicksCount,
    errors,
    finish,
    selectOption,
    reset,
  } = useActivityProgress(buildOptions, isValid, (result) => {
    setLastResult({ activitySlug, ...result, completed: true });
    reportProgress(activitySlug, { ...result, completed: true });
  });

  // A criança escolhe a ordem dentro do módulo, então qualquer atividade pode
  // ser a que fecha. A checagem só sai quando a atividade termina, uma vez por
  // conclusão.
  const completion = useModuleCompletion(moduleSlug, lastResult);
  const moduleFinished = finish && completion.complete;

  const handleReset = () => {
    setLastResult(null);
    reset();
  };

  return (
    <main className="page px-2 py-4 gap-2 sm:gap-4">
      <div className="header-page gap-2">
        <PanelPoints
          hits={optionsFound.length}
          errors={errors}
          rounds={clicksCount}
        />
        <h1 className="title-ativity text-base sm:text-xl md:text-2xl">
          {title}
        </h1>

        <CustomButton
          className="refresh-button min-w-0 h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20"
          onClick={handleReset}
          ariaLabel="Reiniciar atividade"
          leftIcon={
            <TiRefresh
              className="text-2xl sm:text-3xl md:text-4xl"
              style={{ color: 'var(--ink)' }}
            />
          }
        />
      </div>

      <SymbolsGrid
        items={options}
        removing={removing}
        onSelect={selectOption}
        label="Símbolos da atividade"
      />

      <BoxRow justifyContent="space-evenly" width="80%">
        <CustomButton
          href="/"
          ariaLabel="Ir para o início"
          leftIcon={<TiHome style={{ fontSize: '3rem', color: 'var(--ink)' }} />}
        />
        <CustomButton
          text="VOLTAR"
          href={backHref}
          leftIcon={
            <TiArrowLeftThick
              style={{
                left: '0.5rem',
                fontSize: '3rem',
                color: 'var(--ink)',
              }}
            />
          }
        />
        {moduleFinished ? (
          <CustomButton
            text="CONCLUIR MÓDULO"
            href={conclusionPath(moduleSlug)}
            state={{ lastResult }}
            rightIcon={
              <TiArrowRightThick
                style={{ fontSize: '3rem', color: 'var(--ink)' }}
              />
            }
          />
        ) : (
          finish && (
            <CustomButton
              text="PRÓXIMA"
              href={nextHref}
              rightIcon={
                <TiArrowRightThick
                  style={{ fontSize: '3rem', color: 'var(--ink)' }}
                />
              }
            />
          )
        )}
      </BoxRow>
    </main>
  );
};

export default ActivityGrid;
