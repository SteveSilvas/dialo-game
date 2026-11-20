import { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { isAuthenticated, sessionAtom } from '../../state/session';
import { syncStatusAtom } from '../../state/progress';
import './index.css';

/** Tempo que o "Salvo" fica na tela antes de sumir sozinho. */
const CONFIRMATION_MS = 3_000;

/**
 * Aviso discreto de que o progresso está a caminho do servidor. Só aparece
 * para quem tem conta: para o convidado o progresso fica no aparelho e não há
 * o que sincronizar.
 *
 * `aria-live="polite"` anuncia a mudança sem interromper o leitor de tela, e o
 * texto é curto porque a criança está no meio de uma atividade.
 */
const SyncIndicator = () => {
  const session = useAtomValue(sessionAtom);
  const status = useAtomValue(syncStatusAtom);
  const setStatus = useSetAtom(syncStatusAtom);

  useEffect(() => {
    if (status !== 'saved') return;

    // A confirmação é um recado, não um selo permanente: some sozinha para não
    // competir com a atividade.
    const timer = setTimeout(() => setStatus('idle'), CONFIRMATION_MS);
    return () => clearTimeout(timer);
  }, [setStatus, status]);

  if (!isAuthenticated(session) || status === 'idle' || status === 'local') {
    return null;
  }

  const label =
    status === 'saving'
      ? 'Salvando...'
      : status === 'saved'
        ? 'Salvo'
        : 'Salvo neste aparelho. Vamos tentar de novo.';

  return (
    <p
      className={`sync-indicator sync-indicator--${status}`}
      role="status"
      aria-live="polite"
    >
      {label}
    </p>
  );
};

export default SyncIndicator;
