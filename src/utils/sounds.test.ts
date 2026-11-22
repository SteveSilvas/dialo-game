interface FakeAudio {
  src: string;
  currentTime: number;
  play: jest.Mock<Promise<void>, []>;
}

const installAudioMock = (playImpl: () => Promise<void> = () => Promise.resolve()) => {
  const instances: FakeAudio[] = [];
  const AudioMock = jest.fn(function (this: FakeAudio, src: string) {
    this.src = src;
    this.currentTime = 0;
    this.play = jest.fn(playImpl);
    instances.push(this);
  });
  globalThis.Audio = AudioMock as unknown as typeof Audio;
  return { AudioMock, instances };
};

/**
 * Recarrega o módulo junto do átomo: `jest.resetModules()` cria um store novo,
 * então o estado precisa ser escrito no mesmo grafo de módulos que o
 * `playSound` recarregado enxerga.
 */
const loadPlaySound = async () => {
  jest.resetModules();
  const { playSound } = await import('./sounds');
  const { getDefaultStore } = await import('jotai');
  const { soundAtom } = await import('../Context/SoundAtom');

  return {
    playSound,
    setSound: (isActive: boolean) => getDefaultStore().set(soundAtom, { isActive }),
  };
};

describe('playSound', () => {
  const originalAudio = globalThis.Audio;

  afterEach(() => {
    globalThis.Audio = originalAudio;
    jest.restoreAllMocks();
  });

  it('não toca nada quando o som do jogo está desligado', async () => {
    const { AudioMock } = installAudioMock();
    const { playSound, setSound } = await loadPlaySound();

    setSound(false);
    playSound('/audio/clique.mp3');

    expect(AudioMock).not.toHaveBeenCalled();
  });

  it('volta a tocar quando a criança religa o som', async () => {
    const { instances } = installAudioMock();
    const { playSound, setSound } = await loadPlaySound();

    setSound(false);
    playSound('/audio/clique.mp3');
    setSound(true);
    playSound('/audio/clique.mp3');

    expect(instances).toHaveLength(1);
    expect(instances[0]!.play).toHaveBeenCalledTimes(1);
  });

  it('não gera unhandled rejection quando play() é bloqueado pelo navegador', async () => {
    const blocked = new Error('NotAllowedError: autoplay bloqueado');
    const { instances } = installAudioMock(() => Promise.reject(blocked));
    const { playSound, setSound } = await loadPlaySound();
    setSound(true);

    const onUnhandledRejection = jest.fn();
    process.on('unhandledRejection', onUnhandledRejection);

    try {
      expect(() => playSound('/audio/clique.mp3')).not.toThrow();
      await new Promise((resolve) => setTimeout(resolve, 0));
    } finally {
      process.off('unhandledRejection', onUnhandledRejection);
    }

    expect(instances).toHaveLength(1);
    expect(instances[0]!.play).toHaveBeenCalledTimes(1);
    expect(onUnhandledRejection).not.toHaveBeenCalled();
  });

  it('reutiliza a mesma instância de Audio para o mesmo src', async () => {
    const { AudioMock, instances } = installAudioMock();
    const { playSound, setSound } = await loadPlaySound();
    setSound(true);

    playSound('/audio/clique.mp3');
    playSound('/audio/clique.mp3');

    expect(AudioMock).toHaveBeenCalledTimes(1);
    expect(instances).toHaveLength(1);
    expect(instances[0]!.play).toHaveBeenCalledTimes(2);
  });

  it('cria uma instância por src distinto', async () => {
    const { AudioMock, instances } = installAudioMock();
    const { playSound, setSound } = await loadPlaySound();
    setSound(true);

    playSound('/audio/clique.mp3');
    playSound('/audio/acerto.mp3');
    playSound('/audio/clique.mp3');

    expect(AudioMock).toHaveBeenCalledTimes(2);
    expect(instances.map((audio) => audio.src)).toEqual([
      '/audio/clique.mp3',
      '/audio/acerto.mp3',
    ]);
    expect(instances[0]!.play).toHaveBeenCalledTimes(2);
    expect(instances[1]!.play).toHaveBeenCalledTimes(1);
  });
});
