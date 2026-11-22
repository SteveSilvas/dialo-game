import { getDefaultStore } from 'jotai';
import { soundAtom } from '../Context/SoundAtom';

const audioCache = new Map<string, HTMLAudioElement>();

const getAudio = (src: string): HTMLAudioElement => {
    let audio = audioCache.get(src);
    if (!audio) {
        audio = new Audio(src);
        audioCache.set(src, audio);
    }
    return audio;
};

/**
 * Efeitos sonoros do jogo (clique, acerto, erro).
 *
 * O botão de som do cabeçalho é o controle de áudio da criança: se ele está
 * desligado, nada de ambiente deve tocar. Ler o átomo aqui, e não em cada
 * chamador, é o que mantém a regra num lugar só — antes o botão pausava apenas
 * a música de fundo e os efeitos continuavam saindo.
 */
export const playSound = (src: string) => {
    if (!getDefaultStore().get(soundAtom).isActive) return;

    const audio = getAudio(src);
    audio.currentTime = 0;
    // O navegador rejeita play() quando o áudio não foi autorizado por um gesto.
    // Sem o catch, cada clique vira uma unhandled rejection no console.
    void Promise.resolve(audio.play()).catch(() => undefined);
};
