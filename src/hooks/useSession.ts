import { useCallback, useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { refreshSession, SESSION_EXPIRED_EVENT } from '../api/client';
import { logout as logoutRequest } from '../api/auth';
import { sessionAtom } from '../state/session';
import type { User } from '../api/types';
import { importGuestProgressAtom, resetProgressAtom } from '../state/progress';

// A restauração roda uma vez por carregamento. Cada componente que chama
// `useSessionRestore` dispararia o seu próprio refresh, e como o refresh
// rotaciona o token, o segundo pedido invalidaria a sessão do primeiro.
let restoreStarted = false;

/**
 * Restaura a sessão no primeiro carregamento. O token de acesso fica em
 * memória, então quem mantém o login entre recarregamentos é o cookie de
 * refresh (HttpOnly, fora do alcance do JavaScript).
 *
 * Fica separado de `useSession` de propósito: só o `Layout` precisa restaurar,
 * e as páginas que apenas leem a sessão não devem disparar um refresh.
 */
export const useSessionRestore = () => {
  const setSession = useSetAtom(sessionAtom);

  useEffect(() => {
    if (restoreStarted) return;
    restoreStarted = true;

    void (async () => {
      const restored = await refreshSession();

      setSession(
        restored
          ? { status: 'authenticated', user: restored.user }
          : { status: 'anonymous', user: null },
      );
    })();
  }, [setSession]);
};

/**
 * Rebaixa a sessão quando a API recusa o token no meio do jogo. `refreshSession`
 * devolve `null` tanto para "não havia sessão" quanto para "o servidor não
 * respondeu"; aqui só o primeiro caso importa, então a checagem é pelo estado
 * atual — quem estava autenticado e perdeu o token volta a ser visitante.
 *
 * O progresso fica no `localStorage` e na fila: a criança continua de onde
 * parou, agora como convidada, sem perder a rodada.
 */
export const useSessionExpiry = () => {
  const session = useAtomValue(sessionAtom);
  const setSession = useSetAtom(sessionAtom);

  useEffect(() => {
    if (session.status !== 'authenticated') return;

    const handleExpired = () => {
      setSession((current) =>
        current.status === 'authenticated'
          ? { status: 'anonymous', user: null }
          : current,
      );
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
  }, [session.status, setSession]);
};

export const useSession = () => {
  const session = useAtomValue(sessionAtom);
  const setSession = useSetAtom(sessionAtom);
  const importGuestProgress = useSetAtom(importGuestProgressAtom);
  const resetProgress = useSetAtom(resetProgressAtom);

  const signOut = useCallback(async () => {
    await logoutRequest().catch(() => undefined);
    // Antes da sessão: o progresso da conta não pode sobrar para o próximo
    // login no mesmo aparelho.
    resetProgress();
    setSession({ status: 'anonymous', user: null });
  }, [resetProgress, setSession]);

  const signIn = useCallback(
    async (user: User) => {
      // A importação termina antes de a sessão virar autenticada: o catálogo é
      // buscado quando a sessão muda, e buscar antes do import mostraria a
      // trilha zerada por um instante — o progresso "sumiria" na conversão.
      await importGuestProgress();
      setSession({ status: 'authenticated', user });
    },
    [importGuestProgress, setSession],
  );

  return { session, signIn, signOut };
};
