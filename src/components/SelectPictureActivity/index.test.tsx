import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { getDefaultStore } from 'jotai';
import SelectPictureActivity from './index';
import { soundAtom } from '../../Context/SoundAtom';
import type { SelectPictureConfig } from '../../utils/activityConfig';

const config: SelectPictureConfig = {
  kind: 'selectPicture',
  prompt: 'QUAL FIGURA COMEÇA COM O MESMO SOM?',
  speak: 'Bola',
  answer: 'Bala',
  options: [
    { label: 'Bala', emoji: '🍬' },
    { label: 'Dado', emoji: '🎲' },
    { label: 'Pato', emoji: '🦆' },
  ],
};

const renderActivity = (overrides: Partial<SelectPictureConfig> = {}) =>
  render(
    <MemoryRouter>
      <SelectPictureActivity
        moduleSlug="modulo-02"
        activitySlug="modulo-02-atividade-01"
        backHref="/modulo/modulo-02"
        nextHref="/modulo/modulo-02/modulo-02-atividade-02"
        config={{ ...config, ...overrides }}
      />
    </MemoryRouter>,
  );

const pictureButton = (label: string) => screen.getByRole('button', { name: label });

const installSpeech = () => {
  class Utterance {
    text: string;
    lang = '';
    rate = 1;
    voice: SpeechSynthesisVoice | null = null;
    constructor(text: string) {
      this.text = text;
    }
  }
  Object.defineProperty(window, 'SpeechSynthesisUtterance', {
    value: Utterance,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(window, 'speechSynthesis', {
    value: { speak: jest.fn(), cancel: jest.fn(), getVoices: () => [] },
    configurable: true,
    writable: true,
  });
};

const removeSpeech = () => {
  // @ts-expect-error — simulando aparelho sem a API de fala.
  delete window.speechSynthesis;
  // @ts-expect-error — idem.
  delete window.SpeechSynthesisUtterance;
};

describe('SelectPictureActivity', () => {
  beforeEach(() => {
    getDefaultStore().set(soundAtom, { isActive: true });
    installSpeech();
  });

  afterEach(() => {
    removeSpeech();
    getDefaultStore().set(soundAtom, { isActive: false });
  });

  it('mostra o enunciado e as opções', () => {
    renderActivity();

    expect(screen.getByRole('heading', { name: config.prompt })).toBeInTheDocument();
    expect(pictureButton('Bala')).toBeInTheDocument();
    expect(pictureButton('Dado')).toBeInTheDocument();
    expect(pictureButton('Pato')).toBeInTheDocument();
  });

  it('mostra a figura junto do rótulo, sem esconder o texto', () => {
    renderActivity();

    // A figura é decorativa: quem usa leitor de tela depende do rótulo.
    expect(pictureButton('Bala')).toHaveAccessibleName('Bala');
    expect(screen.getByText('🍬')).toHaveAttribute('aria-hidden', 'true');
  });

  it('acertar libera a próxima atividade', async () => {
    renderActivity();

    await userEvent.click(pictureButton('Bala'));

    await waitFor(() =>
      expect(screen.getByRole('link', { name: /PRÓXIMA/i })).toHaveAttribute(
        'href',
        '/modulo/modulo-02/modulo-02-atividade-02',
      ),
    );
  });

  it('errar conta o erro e mantém as opções disponíveis', async () => {
    renderActivity();

    await userEvent.click(pictureButton('Dado'));

    expect(screen.getByRole('alert')).toHaveTextContent(/não é a figura certa/i);
    expect(pictureButton('Dado')).toBeEnabled();
    expect(pictureButton('Bala')).toBeEnabled();
    expect(screen.queryByRole('link', { name: /PRÓXIMA/i })).not.toBeInTheDocument();
  });

  it('não deixa a criança presa: errar não bloqueia o acerto seguinte', async () => {
    renderActivity();

    await userEvent.click(pictureButton('Pato'));
    await waitFor(() =>
      expect(screen.queryByRole('alert')).not.toBeInTheDocument(),
      { timeout: 3000 },
    );
    await userEvent.click(pictureButton('Bala'));

    await waitFor(() =>
      expect(screen.getByRole('link', { name: /PRÓXIMA/i })).toBeInTheDocument(),
    );
  });

  it('desabilita as opções depois do acerto', async () => {
    renderActivity();

    await userEvent.click(pictureButton('Bala'));

    await waitFor(() => expect(pictureButton('Bala')).toBeDisabled());
    expect(pictureButton('Dado')).toBeDisabled();
  });

  it('reiniciar limpa o acerto e volta ao começo', async () => {
    renderActivity();

    await userEvent.click(pictureButton('Bala'));
    await waitFor(() => expect(pictureButton('Bala')).toBeDisabled());

    await userEvent.click(screen.getByRole('button', { name: /Reiniciar atividade/i }));

    expect(pictureButton('Bala')).toBeEnabled();
    expect(screen.queryByRole('link', { name: /PRÓXIMA/i })).not.toBeInTheDocument();
  });

  it('oferece ouvir de novo o som da atividade', () => {
    renderActivity();

    expect(screen.getByRole('button', { name: /Ouvir: Bola/i })).toBeInTheDocument();
  });

  it('fala a palavra sozinho ao abrir a atividade', () => {
    renderActivity();

    expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(1);
    expect(jest.mocked(window.speechSynthesis.speak).mock.calls[0]![0]).toMatchObject({
      text: 'Bola',
      lang: 'pt-BR',
    });
  });

  it('fala de novo quando a criança pede', async () => {
    renderActivity();
    jest.mocked(window.speechSynthesis.speak).mockClear();

    await userEvent.click(screen.getByRole('button', { name: /Ouvir: Bola/i }));

    expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(1);
  });

  it('não fala sozinho com o som do jogo desligado', () => {
    getDefaultStore().set(soundAtom, { isActive: false });
    renderActivity();

    expect(window.speechSynthesis.speak).not.toHaveBeenCalled();
  });

  it('religa o som do jogo ao tocar em ouvir, em vez de ficar inerte', async () => {
    getDefaultStore().set(soundAtom, { isActive: false });
    renderActivity();

    const listen = screen.getByRole('button', { name: /Ouvir: Bola/i });
    expect(listen).toHaveTextContent(/ATIVAR SOM E OUVIR/i);

    await userEvent.click(listen);

    expect(getDefaultStore().get(soundAtom).isActive).toBe(true);
  });

  it('avisa quando o aparelho não tem voz, em vez de esconder o som', () => {
    // Mesmo caminho de um navegador sem vozes instaladas.
    removeSpeech();
    renderActivity();

    expect(screen.getByRole('button', { name: /Som indisponível/i })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent(/não tem voz instalada/i);
  });

  it('não vaza o acerto para outra opção', async () => {
    renderActivity();

    await userEvent.click(pictureButton('Bala'));

    await waitFor(() => expect(pictureButton('Dado')).toBeDisabled());
    expect(pictureButton('Bala')).toHaveClass('picture-option--correct');
    expect(pictureButton('Dado')).not.toHaveClass('picture-option--correct');
  });
});
