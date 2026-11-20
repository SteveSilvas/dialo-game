import { useCallback, useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { refreshSession } from '../api/client';
import { importProgress } from '../api/catalog';
import { logout as logoutRequest } from '../api/auth';
import { sessionAtom } from '../state/session';
import type { User } from '../api/types';
import { clearGuestProgress, readGuestProgress } from '../state/guestProgress';

/**
 * Envia o progresso feito como convidado para a conta recém-logada. A API só
 * melhora o que já existe, então repetir a importação é seguro.
 */
const migrateGuestProgress = async () => {
  const items = readGuestProgress();
  if (items.length === 0) return;

  try {
    await importProgress(items);
    clearGuestProgress();
  } catch {
    // Mantém o progresso local: a próxima entrada tenta de novo.
  }
};

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

export const useSession = () => {
  const session = useAtomValue(sessionAtom);
  const setSession = useSetAtom(sessionAtom);

  const signOut = useCallback(async () => {
    await logoutRequest().catch(() => undefined);
    setSession({ status: 'anonymous', user: null });
  }, [setSession]);

  const signIn = useCallback(
    async (user: User) => {
      // A importação termina antes de a sessão virar autenticada: o catálogo é
      // buscado quando a sessão muda, e buscar antes do import mostraria a
      // trilha zerada por um instante — o progresso "sumiria" na conversão.
      await migrateGuestProgress();
      setSession({ status: 'authenticated', user });
    },
    [setSession],
  );

  return { session, signIn, signOut };
};
