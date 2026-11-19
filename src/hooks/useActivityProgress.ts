import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import errorSong from '../assets/error-8-206492.mp3';
import successSong from '../assets/goodresult-82807.mp3';
import selectSong from '../assets/select-sound-121244.mp3';
import { playSound } from '../utils/sounds';

const REMOVAL_DELAY_MS = 1000;

/**
 * Concentra a lógica de pontuação compartilhada pelas atividades do módulo 01:
 * tentativas, acertos, erros, itens em animação de saída e conclusão.
 */
export const useActivityProgress = (
  buildOptions: () => string[],
  isValid: (option: string) => boolean,
) => {
  const [options, setOptions] = useState<string[]>(buildOptions);
  const [optionsFound, setOptionsFound] = useState<string[]>([]);
  const [removing, setRemoving] = useState<string[]>([]);
  const [clicksCount, setClicksCount] = useState(0);
  const [errors, setErrors] = useState(0);
  // Um timer por item: cliques em itens diferentes durante a animação não
  // podem cancelar a saída um do outro.
  const removalTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const finish = useMemo(
    () => optionsFound.length > 0 && options.every((item) => !isValid(item)),
    [optionsFound, options, isValid],
  );

  useEffect(() => {
    if (finish) {
      playSound(successSong);
    }
  }, [finish]);

  const clearRemovalTimers = useCallback(() => {
    removalTimers.current.forEach((timer) => clearTimeout(timer));
    removalTimers.current.clear();
  }, []);

  useEffect(() => clearRemovalTimers, [clearRemovalTimers]);

  const selectOption = (option: string) => {
    // Item já em animação de saída: um segundo clique não pode contar de novo.
    if (removalTimers.current.has(option)) return;

    setClicksCount((count) => count + 1);

    if (!isValid(option)) {
      setErrors((count) => count + 1);
      playSound(errorSong);
      return;
    }

    playSound(selectSong);
    setRemoving((current) => [...current, option]);
    removalTimers.current.set(
      option,
      setTimeout(() => {
        removalTimers.current.delete(option);
        setOptionsFound((found) => [...found, option]);
        setOptions((current) => current.filter((item) => item !== option));
        setRemoving((current) => current.filter((item) => item !== option));
      }, REMOVAL_DELAY_MS),
    );
  };

  const reset = () => {
    // Sem isso, um timer pendente removeria um símbolo do novo sorteio.
    clearRemovalTimers();
    setOptionsFound([]);
    setClicksCount(0);
    setErrors(0);
    setRemoving([]);
    setOptions(buildOptions());
  };

  return {
    options,
    optionsFound,
    removing,
    clicksCount,
    errors,
    finish,
    selectOption,
    reset,
  };
};
