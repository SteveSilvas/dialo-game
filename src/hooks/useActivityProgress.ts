import { useEffect, useMemo, useState } from 'react';
import clickSong from '../assets/click-151673.mp3';
import errorSong from '../assets/error-8-206492.mp3';
import successSong from '../assets/goodresult-82807.mp3';
import selectSong from '../assets/select-sound-121244.mp3';
import { playSound } from '../utils/sounds';

const REMOVAL_DELAY_MS = 1000;

/**
 * Concentra a lógica de pontuação compartilhada pelas atividades do módulo 01:
 * tentativas, acertos, erros, item em animação de saída e conclusão.
 */
export const useActivityProgress = (
  buildOptions: () => string[],
  isValid: (option: string) => boolean,
) => {
  const [options, setOptions] = useState<string[]>(buildOptions);
  const [optionsFound, setOptionsFound] = useState<string[]>([]);
  const [removing, setRemoving] = useState<string | null>(null);
  const [clicksCount, setClicksCount] = useState(0);

  const finish = useMemo(
    () => optionsFound.length > 0 && options.every((item) => !isValid(item)),
    [optionsFound, options, isValid],
  );

  useEffect(() => {
    if (finish) {
      playSound(successSong);
    }
  }, [finish]);

  const selectOption = (option: string) => {
    setClicksCount((count) => count + 1);

    if (!isValid(option)) {
      playSound(errorSong);
      return;
    }

    playSound(selectSong);
    setRemoving(option);
    setTimeout(() => {
      setOptionsFound((found) => [...found, option]);
      setOptions((current) => current.filter((item) => item !== option));
      setRemoving(null);
    }, REMOVAL_DELAY_MS);
  };

  const reset = () => {
    playSound(clickSong);
    setOptionsFound([]);
    setClicksCount(0);
    setOptions(buildOptions());
  };

  return {
    options,
    optionsFound,
    removing,
    clicksCount,
    errors: clicksCount - optionsFound.length,
    finish,
    selectOption,
    reset,
  };
};
