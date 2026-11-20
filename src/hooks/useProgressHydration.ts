import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { readGuestProgress } from '../state/guestProgress';
import { pendingAtom, progressAtom, toProgressMap } from '../state/progress';

/**
 * Traz para o átomo o progresso que ficou no aparelho. O `localStorage` só é
 * lido uma vez por montagem, não a cada render: a partir daí o átomo é a fonte
 * da verdade em memória e o storage só recebe escrita.
 *
 * Toda escrita passa pelo storage antes de chegar ao átomo, então o que está
 * lá é sempre o estado mais recente e a leitura pode substituir o átomo.
 */
export const useProgressHydration = () => {
  const setProgress = useSetAtom(progressAtom);
  const setPending = useSetAtom(pendingAtom);

  useEffect(() => {
    const stored = toProgressMap(readGuestProgress());

    setPending(stored);
    setProgress((current) => ({ ...stored, ...current }));
  }, [setPending, setProgress]);
};
