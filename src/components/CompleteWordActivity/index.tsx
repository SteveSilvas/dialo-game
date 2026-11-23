import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TiArrowLeftThick, TiArrowRightThick, TiHome, TiRefresh } from 'react-icons/ti';
import BoxRow from '../BoxRow';
import CustomButton from '../Button';
import ListenButton from '../ListenButton';
import PanelPoints from '../PanelPoints';
import { useModuleCompletion } from '../../hooks/useModuleCompletion';
import { useProgressReporter } from '../../hooks/useProgressReporter';
import type { ActivityResult } from '../../utils/moduleSummary';
import { conclusionPath } from '../../utils/paths';
import { shuffleArray } from '../../utils/functions';
import { prefersReducedMotion } from '../../utils/motion';
import { playSound } from '../../utils/sounds';
import { speak, stopSpeaking } from '../../utils/speech';
import errorSong from '../../assets/error-8-206492.mp3';
import successSong from '../../assets/goodresult-82807.mp3';
import selectSong from '../../assets/select-sound-121244.mp3';
import type { CompleteWordConfig } from '../../utils/activityConfig';
import './index.css';

type CompleteWordActivityProps = {
  moduleSlug: string;
  activitySlug: string;
  /** Próxima atividade do módulo, quando existir. */
  nextHref?: string;
  config: CompleteWordConfig;
  /** Destino do botão VOLTAR. */
  backHref: string;
};

const FEEDBACK_MS = 900;

/**
 * Completar a sílaba que falta.
 *
 * O módulo 03 monta a palavra inteira a partir do banco de sílabas. Aqui a
 * palavra já aparece montada com uma posição vazia, e a criança escolhe a sílaba
 * que fecha a palavra entre opções que diferem só na vogal — é a discriminação
 * fina que a síntese silábica exige, e não a repetição do módulo anterior.
 *
 * A figura e a palavra falada existem para quem ainda não lê: sem elas a
 * atividade viraria leitura de texto, que é o módulo 05.
 */
const CompleteWordActivity = ({
  moduleSlug,
  activitySlug,
  nextHref,
  config,
  backHref,
}: CompleteWordActivityProps) => {
  const reportProgress = useProgressReporter();

  const [round, setRound] = useState(0);
  const options = useMemo(
    () => shuffleArray(config.options),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.options, round],
  );

  const [chosen, setChosen] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [errors, setErrors] = useState(0);
  const [feedback, setFeedback] = useState<'idle' | 'wrong' | 'right'>('idle');
  const [lastResult, setLastResult] = useState<ActivityResult | null>(null);

  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      stopSpeaking();
    },
    [],
  );

  const correct = chosen === config.answer;
  const completion = useModuleCompletion(moduleSlug, lastResult);
  const moduleFinished = correct && completion.complete;

  const reported = useRef(false);
  useEffect(() => {
    if (!correct || reported.current) return;

    reported.current = true;
    playSound(successSong);

    const result = { bestScore: 1, attempts, errors };
    setLastResult({ activitySlug, ...result, completed: true });
    reportProgress(activitySlug, { ...result, completed: true });
  }, [correct, attempts, errors, activitySlug, reportProgress]);

  const showFeedback = useCallback((kind: 'wrong' | 'right') => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback(kind);
    feedbackTimer.current = setTimeout(
      () => setFeedback('idle'),
      prefersReducedMotion() ? 0 : FEEDBACK_MS,
    );
  }, []);

  const select = (label: string) => {
    if (correct || feedback === 'wrong') return;

    setAttempts((count) => count + 1);

    if (label !== config.answer) {
      setErrors((count) => count + 1);
      playSound(errorSong);
      showFeedback('wrong');
      return;
    }

    playSound(selectSong);
    showFeedback('right');
    setChosen(label);
    speak(config.speak);
  };

  const restart = () => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    stopSpeaking();
    reported.current = false;
    setChosen(null);
    setAttempts(0);
    setErrors(0);
    setFeedback('idle');
    setLastResult(null);
    setRound((value) => value + 1);
  };

  return (
    <main className="page px-2 py-4 gap-2 sm:gap-4">
      <div className="complete-word-header gap-2">
        <PanelPoints hits={correct ? 1 : 0} errors={errors} rounds={attempts} />

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

      <h1 className="complete-word-title text-base sm:text-xl md:text-2xl">
        {config.prompt}
      </h1>

      {/* A figura é a pista para quem ainda não lê. Sem emoji, a palavra escrita
          ocupa o lugar dela em vez de deixar um espaço vazio. */}
      <div className="complete-word-figure" role="img" aria-label={config.word}>
        <span aria-hidden="true">
          {config.emoji ?? config.word}
        </span>
      </div>

      <ListenButton text={config.speak} />

      {/* A palavra em construção é o retorno principal: as sílabas já conhecidas
          aparecem e o buraco mostra onde a criança está trabalhando. */}
      <div
        className={`complete-word-slots${feedback === 'wrong' ? ' complete-word-slots--wrong' : ''}`}
        role="status"
        aria-live="polite"
        aria-label={
          correct
            ? `Palavra completa: ${config.word}`
            : `Palavra incompleta: falta a sílaba ${config.missingIndex + 1}`
        }
      >
        {config.syllables.map((syllable, position) => {
          const isMissing = position === config.missingIndex;
          const filled = isMissing && correct;
          const text = isMissing ? (filled ? config.answer : '') : syllable;
          return (
            <span
              key={position}
              className={`complete-word-slot${isMissing ? ' complete-word-slot--blank' : ''}${
                filled ? ' complete-word-slot--filled' : ''
              }`}
            >
              {text || '?'}
            </span>
          );
        })}
      </div>

      {feedback === 'wrong' && (
        <p className="complete-word-feedback" role="alert">
          Essa sílaba não forma a palavra. Tente outra.
        </p>
      )}

      <div className="syllable-options" role="group" aria-label="Sílabas disponíveis">
        {options.map((option) => {
          const isAnswer = option === config.answer;
          return (
            <button
              key={option}
              type="button"
              className={`syllable-option${correct && isAnswer ? ' syllable-option--correct' : ''}`}
              onClick={() => select(option)}
              // Desabilitar durante o retorno de erro, em vez de só ignorar o
              // clique, evita o botão que parece ativo e não responde — a
              // criança toca de novo e nada acontece.
              disabled={correct || feedback === 'wrong'}
              aria-label={`Sílaba ${option}`}
            >
              {option}
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
          correct &&
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

export default CompleteWordActivity;
