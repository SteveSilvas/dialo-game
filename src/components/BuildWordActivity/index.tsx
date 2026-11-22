import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TiArrowLeftThick, TiArrowRightThick, TiHome, TiRefresh } from 'react-icons/ti';
import BoxRow from '../BoxRow';
import CustomButton from '../Button';
import PanelPoints from '../PanelPoints';
import { useModuleCompletion } from '../../hooks/useModuleCompletion';
import { useProgressReporter } from '../../hooks/useProgressReporter';
import type { ActivityResult } from '../../utils/moduleSummary';
import { conclusionPath } from '../../utils/paths';
import { shuffleArray } from '../../utils/functions';
import { prefersReducedMotion } from '../../utils/motion';
import { playSound } from '../../utils/sounds';
import errorSong from '../../assets/error-8-206492.mp3';
import successSong from '../../assets/goodresult-82807.mp3';
import selectSong from '../../assets/select-sound-121244.mp3';
import type { BuildWordConfig } from '../../utils/activityConfig';
import './index.css';

type BuildWordActivityProps = {
  moduleSlug: string;
  activitySlug: string;
  /** Próxima atividade do módulo, quando existir. */
  nextHref?: string;
  config: BuildWordConfig;
  /** Destino do botão VOLTAR. */
  backHref: string;
};

const FEEDBACK_MS = 900;

/**
 * Montagem de palavra a partir de sílabas embaralhadas.
 *
 * A criança toca nas sílabas na ordem; acerto entra na palavra, erro conta e a
 * sílaba continua no banco. Tocar resolve no toque e no teclado, então a
 * atividade não depende de arrastar.
 */
const BuildWordActivity = ({
  moduleSlug,
  activitySlug,
  nextHref,
  config,
  backHref,
}: BuildWordActivityProps) => {
  const reportProgress = useProgressReporter();

  // Identidade da rodada: muda no reinício e força um novo embaralhamento sem
  // guardar o banco em estado próprio.
  const [round, setRound] = useState(0);
  const bank = useMemo(
    () => shuffleArray(config.syllables.map((text, index) => ({ text, index }))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.syllables, round],
  );

  const [placed, setPlaced] = useState<number[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [errors, setErrors] = useState(0);
  const [feedback, setFeedback] = useState<'idle' | 'wrong' | 'right'>('idle');
  const [lastResult, setLastResult] = useState<ActivityResult | null>(null);

  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    },
    [],
  );

  const complete = placed.length === config.syllables.length;
  const completion = useModuleCompletion(moduleSlug, lastResult);
  const moduleFinished = complete && completion.complete;

  // O relatório sai uma vez por conclusão; `restart` libera a próxima.
  const reported = useRef(false);

  useEffect(() => {
    if (!complete || reported.current) return;

    reported.current = true;
    playSound(successSong);

    const result = { bestScore: config.syllables.length, attempts, errors };
    setLastResult({ activitySlug, ...result, completed: true });
    reportProgress(activitySlug, { ...result, completed: true });
  }, [complete, attempts, errors, config.syllables.length, activitySlug, reportProgress]);

  const showFeedback = useCallback((kind: 'wrong' | 'right') => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback(kind);
    feedbackTimer.current = setTimeout(
      () => setFeedback('idle'),
      prefersReducedMotion() ? 0 : FEEDBACK_MS,
    );
  }, []);

  const select = (position: number) => {
    // Só o erro bloqueia: acertar precisa liberar a sílaba seguinte na hora, e
    // a criança não deve esperar a animação para continuar montando.
    if (complete || feedback === 'wrong') return;

    const syllable = bank[position];
    if (!syllable) return;
    // Sílabas repetidas ("BA" duas vezes) precisam ser distinguidas pelo índice
    // original, senão o mesmo botão poderia ser usado duas vezes.
    if (placed.includes(syllable.index)) return;

    setAttempts((count) => count + 1);

    if (syllable.index !== placed.length) {
      setErrors((count) => count + 1);
      playSound(errorSong);
      showFeedback('wrong');
      return;
    }

    playSound(selectSong);
    showFeedback('right');
    setPlaced((current) => [...current, syllable.index]);
  };

  const restart = () => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    reported.current = false;
    setPlaced([]);
    setAttempts(0);
    setErrors(0);
    setFeedback('idle');
    setLastResult(null);
    setRound((value) => value + 1);
  };

  const builtWord = placed.map((index) => config.syllables[index]).join('');

  return (
    <main className="page px-2 py-4 gap-2 sm:gap-4">
      <div className="build-word-header gap-2">
        <PanelPoints hits={placed.length} errors={errors} rounds={attempts} />

        <CustomButton
          className="refresh-button min-w-0 h-12 w-12 sm:h-16 sm:w-16"
          onClick={restart}
          ariaLabel="Reiniciar atividade"
          leftIcon={
            <TiRefresh
              className="text-2xl sm:text-3xl"
              style={{ color: 'var(--ink)' }}
            />
          }
        />
      </div>

      <h1 className="build-word-title text-base sm:text-xl md:text-2xl">
        {config.prompt}
      </h1>

      {/* A palavra em construção é o retorno principal: cada sílaba escolhida
          aparece aqui, então a criança vê o que já montou. */}
      <div
        className={`word-slots${feedback === 'wrong' ? ' word-slots--wrong' : ''}`}
        role="status"
        aria-live="polite"
        aria-label={
          complete
            ? `Palavra completa: ${builtWord}`
            : `Palavra em construção: ${builtWord || 'vazia'}`
        }
      >
        {config.syllables.map((_, position) => {
          const index = placed[position];
          const text = index === undefined ? '' : config.syllables[index];
          return (
            <span
              key={position}
              className={`word-slot${text ? ' word-slot--filled' : ''}`}
            >
              {text || '·'}
            </span>
          );
        })}
      </div>

      {feedback === 'wrong' && (
        <p className="word-feedback" role="alert">
          Essa sílaba não vem agora. Tente outra.
        </p>
      )}

      <div className="syllable-bank" role="group" aria-label="Sílabas disponíveis">
        {bank.map((syllable, position) => {
          const used = placed.includes(syllable.index);
          return (
            <button
              key={`${syllable.text}-${syllable.index}`}
              type="button"
              className={`syllable${used ? ' syllable--used' : ''}`}
              onClick={() => select(position)}
              disabled={used || complete}
              aria-label={`Sílaba ${syllable.text}`}
            >
              {syllable.text}
            </button>
          );
        })}
      </div>

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
              style={{ left: '0.5rem', fontSize: '3rem', color: 'var(--ink)' }}
            />
          }
        />
        {moduleFinished ? (
          <CustomButton
            text="CONCLUIR MÓDULO"
            href={conclusionPath(moduleSlug)}
            state={{ lastResult }}
            rightIcon={
              <TiArrowRightThick style={{ fontSize: '3rem', color: 'var(--ink)' }} />
            }
          />
        ) : (
          complete &&
          nextHref && (
            <CustomButton
              text="PRÓXIMA"
              href={nextHref}
              rightIcon={
                <TiArrowRightThick style={{ fontSize: '3rem', color: 'var(--ink)' }} />
              }
            />
          )
        )}
      </BoxRow>
    </main>
  );
};

export default BuildWordActivity;
