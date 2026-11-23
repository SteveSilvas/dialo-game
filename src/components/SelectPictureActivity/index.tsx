import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TiArrowLeftThick, TiArrowRightThick, TiHome, TiRefresh } from 'react-icons/ti';
import BoxRow from '../BoxRow';
import ListenButton from '../ListenButton';
import CustomButton from '../Button';
import PanelPoints from '../PanelPoints';
import { useModuleCompletion } from '../../hooks/useModuleCompletion';
import { useProgressReporter } from '../../hooks/useProgressReporter';
import type { ActivityResult } from '../../utils/moduleSummary';
import { conclusionPath } from '../../utils/paths';
import { shuffleArray } from '../../utils/functions';
import { prefersReducedMotion } from '../../utils/motion';
import { playSound } from '../../utils/sounds';
import { getSpeechStatus, speak, stopSpeaking } from '../../utils/speech';
import errorSong from '../../assets/error-8-206492.mp3';
import successSong from '../../assets/goodresult-82807.mp3';
import selectSong from '../../assets/select-sound-121244.mp3';
import type { SelectPictureConfig } from '../../utils/activityConfig';
import './index.css';

type SelectPictureActivityProps = {
  moduleSlug: string;
  activitySlug: string;
  /** Próxima atividade do módulo, quando existir. */
  nextHref?: string;
  config: SelectPictureConfig;
  /** Destino do botão VOLTAR. */
  backHref: string;
};

const FEEDBACK_MS = 900;

/**
 * Escolha da figura que corresponde a um som.
 *
 * O enunciado é falado por TTS e também aparece escrito: quem não tem voz
 * instalada no sistema, ou está num ambiente silencioso, ainda consegue jogar.
 * Sem essa redundância o módulo viraria um exercício impossível para parte das
 * crianças — que é exatamente o motivo de ele ter ficado bloqueado.
 */
const SelectPictureActivity = ({
  moduleSlug,
  activitySlug,
  nextHref,
  config,
  backHref,
}: SelectPictureActivityProps) => {
  const reportProgress = useProgressReporter();
  const speechAvailable = getSpeechStatus() === 'available';

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
    // Só o erro bloqueia: acertar encerra a atividade, e o toque seguinte não
    // deve esperar a animação para responder.
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
  };

  // Fala sozinho ao abrir: quem ainda não lê não descobriria o botão. Se o
  // navegador bloquear a fala sem gesto, o botão continua ali para a criança
  // tocar.
  useEffect(() => {
    speak(config.speak);
  }, [config.speak, round]);

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
      <div className="select-picture-header gap-2">
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

      <h1 className="select-picture-title text-base sm:text-xl md:text-2xl">
        {config.prompt}
      </h1>

      <ListenButton text={config.speak} />

      {!speechAvailable && (
        <p className="select-picture-note" role="status">
          Este aparelho não tem voz instalada. Leia o enunciado e escolha a figura.
        </p>
      )}

      {feedback === 'wrong' && (
        <p className="select-picture-feedback" role="alert">
          Essa não é a figura certa. Ouça de novo e tente outra.
        </p>
      )}

      <div className="picture-options" role="group" aria-label="Figuras">
        {options.map((option) => {
          const isAnswer = option.label === config.answer;
          return (
            <button
              key={option.label}
              type="button"
              className={`picture-option${correct && isAnswer ? ' picture-option--correct' : ''}`}
              onClick={() => select(option.label)}
              disabled={correct}
              aria-label={option.label}
            >
              {option.emoji && (
                <span className="picture-option__emoji" aria-hidden="true">
                  {option.emoji}
                </span>
              )}
              <span className="picture-option__label">{option.label}</span>
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

export default SelectPictureActivity;
