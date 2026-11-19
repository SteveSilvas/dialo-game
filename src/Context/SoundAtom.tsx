import { atom } from 'jotai';

export type SoundState = {
  isActive: boolean;
};

export const soundAtom = atom<SoundState>({
  isActive: false,
});
