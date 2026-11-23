import { getDefaultStore } from 'jotai';
import { getSpeechStatus, speak, stopSpeaking } from './speech';
import { soundAtom } from '../Context/SoundAtom';

type FakeUtterance = {
  text: string;
  lang: string;
  rate: number;
  voice: SpeechSynthesisVoice | null;
};

type FakeVoice = { lang: string; name: string };

const installSpeech = (voices: FakeVoice[] = []) => {
  const spoken: FakeUtterance[] = [];
  const speakMock = jest.fn();
  const cancelMock = jest.fn();

  class FakeSynthesisUtterance {
    text: string;
    lang = '';
    rate = 1;
    voice: SpeechSynthesisVoice | null = null;

    constructor(text: string) {
      this.text = text;
      spoken.push(this as unknown as FakeUtterance);
    }
  }

  const synthesis = {
    speak: speakMock.mockImplementation((utterance: FakeUtterance) => {
      expect(utterance).toBeDefined();
    }),
    cancel: cancelMock,
    getVoices: () => voices as unknown as SpeechSynthesisVoice[],
  };

  Object.defineProperty(window, 'speechSynthesis', {
    value: synthesis,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(window, 'SpeechSynthesisUtterance', {
    value: FakeSynthesisUtterance,
    configurable: true,
    writable: true,
  });

  return { spoken, speakMock, cancelMock };
};

const removeSpeech = () => {
  // @ts-expect-error — removendo para simular navegador sem a API.
  delete window.speechSynthesis;
  // @ts-expect-error — idem.
  delete window.SpeechSynthesisUtterance;
};

describe('speech', () => {
  beforeEach(() => {
    getDefaultStore().set(soundAtom, { isActive: true });
  });

  afterEach(() => {
    getDefaultStore().set(soundAtom, { isActive: false });
    removeSpeech();
    jest.restoreAllMocks();
  });

  it('reporta indisponível quando o navegador não tem a API', () => {
    removeSpeech();

    expect(getSpeechStatus()).toBe('unavailable');
    expect(speak('Bola')).toBe(false);
  });

  it('fala o texto em português do Brasil', () => {
    const { spoken, speakMock } = installSpeech();

    expect(speak('Bola')).toBe(true);
    expect(speakMock).toHaveBeenCalledTimes(1);
    expect(spoken[0]!.text).toBe('Bola');
    expect(spoken[0]!.lang).toBe('pt-BR');
  });

  it('prefere a voz pt-BR quando existe', () => {
    const { spoken } = installSpeech([
      { lang: 'en-US', name: 'English' },
      { lang: 'pt-BR', name: 'Portuguese' },
    ]);

    speak('Bola');

    expect(spoken[0]!.voice).toEqual({ lang: 'pt-BR', name: 'Portuguese' });
  });

  it('cai para outra voz em português quando não há pt-BR', () => {
    const { spoken } = installSpeech([
      { lang: 'en-US', name: 'English' },
      { lang: 'pt-PT', name: 'Português' },
    ]);

    speak('Bola');

    expect(spoken[0]!.voice).toEqual({ lang: 'pt-PT', name: 'Português' });
  });

  it('não usa voz nenhuma quando o sistema não oferece português', () => {
    const { spoken } = installSpeech([{ lang: 'en-US', name: 'English' }]);

    speak('Bola');

    expect(spoken[0]!.voice).toBeNull();
  });

  it('cancela a fala anterior antes de falar de novo', () => {
    const { cancelMock } = installSpeech();

    speak('Bola');
    speak('Casa');

    // Duas palavras sobrepostas viram ruído.
    expect(cancelMock).toHaveBeenCalledTimes(2);
  });

  it('não fala nada com o som do jogo desligado', () => {
    const { speakMock } = installSpeech();
    getDefaultStore().set(soundAtom, { isActive: false });

    expect(speak('Bola')).toBe(false);
    expect(speakMock).not.toHaveBeenCalled();
  });

  it('não fala texto vazio', () => {
    const { speakMock } = installSpeech();

    expect(speak('   ')).toBe(false);
    expect(speakMock).not.toHaveBeenCalled();
  });

  it('stopSpeaking cancela sem quebrar quando a API não existe', () => {
    removeSpeech();

    expect(() => stopSpeaking()).not.toThrow();
  });
});
