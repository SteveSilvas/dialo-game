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

const loadPlaySound = async (): Promise<typeof import('./sounds').playSound> => {
  jest.resetModules();
  return (await import('./sounds')).playSound;
};

describe('playSound', () => {
  const originalAudio = globalThis.Audio;

  afterEach(() => {
    globalThis.Audio = originalAudio;
    jest.restoreAllMocks();
  });

  it('não gera unhandled rejection quando play() é bloqueado pelo navegador', async () => {
    const blocked = new Error('NotAllowedError: autoplay bloqueado');
    const { instances } = installAudioMock(() => Promise.reject(blocked));
    const playSound = await loadPlaySound();

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
    const playSound = await loadPlaySound();

    playSound('/audio/clique.mp3');
    playSound('/audio/clique.mp3');

    expect(AudioMock).toHaveBeenCalledTimes(1);
    expect(instances).toHaveLength(1);
    expect(instances[0]!.play).toHaveBeenCalledTimes(2);
  });

  it('cria uma instância por src distinto', async () => {
    const { AudioMock, instances } = installAudioMock();
    const playSound = await loadPlaySound();

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
