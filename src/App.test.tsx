import { act, fireEvent, render, screen } from '@testing-library/react';
import { getDefaultStore } from 'jotai';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import App from './App';
import Layout from './components/layout';
import { soundAtom } from './Context/SoundAtom';

const renderHome = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<App />} />
          <Route path="/modulo-01" element={<p>módulo 01</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

describe('Home (INICIAR)', () => {
  beforeEach(() => {
    getDefaultStore().set(soundAtom, { isActive: false });
    jest.clearAllMocks();
  });

  it('não cria players de áudio próprios', () => {
    const { container } = renderHome();

    // Só o player centralizado no Layout existe.
    expect(container.querySelectorAll('audio')).toHaveLength(1);
  });

  it('só toca a música de fundo depois do gesto em INICIAR', () => {
    const play = jest.mocked(window.HTMLMediaElement.prototype.play);
    const { container } = renderHome();
    const backgroundAudio = container.querySelector('audio');

    expect(play.mock.instances).not.toContain(backgroundAudio);

    act(() => {
      fireEvent.click(screen.getByText('INICIAR'));
    });

    expect(getDefaultStore().get(soundAtom).isActive).toBe(true);
    expect(play.mock.instances).toContain(backgroundAudio);
  });
});
