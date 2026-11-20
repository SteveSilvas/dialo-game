import { useEffect, useRef } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { isAuthenticated, sessionAtom } from '../state/session';
import {
  flushProgressAtom,
  progressQueueAtom,
  syncStatusAtom,
} from '../state/progress';

const RETRY_BASE_MS = 2_000;
const RETRY_MAX_MS = 60_000;

/**
 * Sincronização em segundo plano: sobe a fila para o servidor sem prender a
 * criança na tela. Quem joga sem conta não tem para onde enviar — a fila é o
 * próprio progresso e fica no aparelho.
 *
 * Falha de rede não perde nada (a fila está no `localStorage`) e não trava o
 * jogo: a próxima rodada sai quando a conexão volta, com espera crescente para
 * não martelar um servidor fora do ar.
 */
export const useProgressSync = () => {
  const session = useAtomValue(sessionAtom);
  const authenticated = isAuthenticated(session);
  const queue = useAtomValue(progressQueueAtom);
  const status = useAtomValue(syncStatusAtom);
  const flush = useSetAtom(flushProgressAtom);
  const retries = useRef(0);

  // A espera volta ao início só quando a fila esvazia. Zerar a cada rodada
  // faria a espera crescente nunca crescer: a própria tentativa passa por
  // "saving" antes de falhar de novo.
  useEffect(() => {
    if (queue.length === 0) retries.current = 0;
  }, [queue.length]);

  useEffect(() => {
    if (!authenticated || queue.length === 0 || status === 'offline') return;
    void flush();
  }, [authenticated, queue.length, status, flush]);

  useEffect(() => {
    if (!authenticated || queue.length === 0 || status !== 'offline') return;

    const delay = Math.min(RETRY_BASE_MS * 2 ** retries.current, RETRY_MAX_MS);
    retries.current += 1;

    const timer = setTimeout(() => {
      void flush();
    }, delay);

    return () => clearTimeout(timer);
  }, [authenticated, queue.length, status, flush]);

  useEffect(() => {
    if (!authenticated) return;

    // O evento `online` é o aviso mais cedo de que a rede voltou.
    const retry = () => {
      void flush();
    };

    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, [authenticated, flush]);
};
