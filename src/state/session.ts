import { atom } from 'jotai';
import type { User } from '../api/types';

/**
 * `error` cobre o caso em que a API não responde: o jogo continua jogável em
 * modo convidado, sem derrubar a trilha.
 */
export type SessionStatus = 'loading' | 'anonymous' | 'authenticated' | 'error';

export type Session = {
  status: SessionStatus;
  user: User | null;
};

export const sessionAtom = atom<Session>({ status: 'loading', user: null });

export const isAuthenticated = (session: Session) =>
  session.status === 'authenticated' && session.user !== null;
