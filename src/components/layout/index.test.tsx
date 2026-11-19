import { act, fireEvent, render } from '@testing-library/react';
import { getDefaultStore } from 'jotai';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { soundAtom } from '../../Context/SoundAtom';
import Layout from './index';

const renderLayout = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<p>conteúdo da rota</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

const getAudio = (container: HTMLElement) => {
  const audio = container.querySelector('audio');
  if (!audio) throw new Error('player de áudio não encontrado');
  return audio;
};

const getSoundButton = (container: HTMLElement) => {
  const icon = container.querySelector('.icon-sound');
  if (!icon) throw new Error('botão de som não encontrado');
  return icon;
};

describe('Layout (música de fundo)', () => {
  beforeEach(() => {
    getDefaultStore().set(soundAtom, { isActive: false });
    jest.clearAllMocks();
  });

  it('renderiza um único player em loop com preload="none"', () => {
    const { container } = renderLayout();
    const audio = getAudio(container);

    expect(container.querySelectorAll('audio')).toHaveLength(1);
    expect(audio.loop).toBe(true);
    expect(audio.getAttribute('preload')).toBe('none');
    expect(
      Array.from(audio.querySelectorAll('source')).map((source) =>
        source.getAttribute('src'),
      ),
    ).toEqual(['/audio/fundo.ogg', '/audio/fundo.mp3']);
  });

  it('não toca o áudio antes do gesto do usuário', () => {
    const play = jest.mocked(window.HTMLMediaElement.prototype.play);

    renderLayout();

    expect(play).not.toHaveBeenCalled();
  });

  it('não instancia new Audio() a cada render', () => {
    const audioConstructor = jest.fn();
    const originalAudio = window.Audio;
    Object.defineProperty(window, 'Audio', {
      configurable: true,
      value: audioConstructor,
    });

    try {
      const { container, rerender } = renderLayout();
      const firstAudio = getAudio(container);

      act(() => {
        getDefaultStore().set(soundAtom, { isActive: true });
      });
      rerender(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<p>conteúdo da rota</p>} />
            </Route>
          </Routes>
        </MemoryRouter>,
      );

      expect(audioConstructor).not.toHaveBeenCalled();
      expect(getAudio(container)).toBe(firstAudio);
    } finally {
      Object.defineProperty(window, 'Audio', {
        configurable: true,
        value: originalAudio,
      });
    }
  });

  it('toca ao ativar o som e pausa ao desativar', () => {
    const play = jest.mocked(window.HTMLMediaElement.prototype.play);
    const pause = jest.mocked(window.HTMLMediaElement.prototype.pause);
    const { container } = renderLayout();
    const audio = getAudio(container);

    fireEvent.click(getSoundButton(container));

    // O clique também toca o som de efeito do botão, por isso verificamos o
    // player de fundo especificamente em vez do total de chamadas.
    expect(play.mock.instances).toContain(audio);
    expect(getDefaultStore().get(soundAtom).isActive).toBe(true);

    fireEvent.click(getSoundButton(container));

    expect(pause.mock.instances).toContain(audio);
    expect(audio.currentTime).toBe(0);
    expect(getDefaultStore().get(soundAtom).isActive).toBe(false);
  });
});
