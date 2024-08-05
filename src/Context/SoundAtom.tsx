import { atom } from 'jotai';

export type Sound ={
    name: string;
    src: string;
    isActive: boolean;
}

export const soundAtom = atom<Sound>({
    name: '',
    src: '',
    isActive: false
});