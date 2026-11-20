const audioCache = new Map<string, HTMLAudioElement>();

const getAudio = (src: string): HTMLAudioElement => {
    let audio = audioCache.get(src);
    if (!audio) {
        audio = new Audio(src);
        audioCache.set(src, audio);
    }
    return audio;
};

export const playSound = (src: string) => {
    const audio = getAudio(src);
    audio.currentTime = 0;
    // O navegador rejeita play() quando o áudio não foi autorizado por um gesto.
    // Sem o catch, cada clique vira uma unhandled rejection no console.
    void Promise.resolve(audio.play()).catch(() => undefined);
};
