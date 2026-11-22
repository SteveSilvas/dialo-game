import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import BuildWordActivity from './index';
import type { BuildWordConfig } from '../../utils/activityConfig';

const config: BuildWordConfig = {
  kind: 'buildWord',
  word: 'BALA',
  syllables: ['BA', 'LA'],
  prompt: 'MONTE A PALAVRA: BALA',
};

const renderActivity = (overrides: Partial<BuildWordConfig> = {}) =>
  render(
    <MemoryRouter>
      <BuildWordActivity
        moduleSlug="modulo-03"
        activitySlug="modulo-03-atividade-01"
        backHref="/modulo/modulo-03"
        nextHref="/modulo/modulo-03/modulo-03-atividade-02"
        config={{ ...config, ...overrides }}
      />
    </MemoryRouter>,
  );

const syllableButton = (text: string) =>
  screen.getByRole('button', { name: `Sílaba ${text}` });

describe('BuildWordActivity', () => {
  it('mostra o enunciado e as sílabas embaralhadas', () => {
    renderActivity();

    expect(screen.getByRole('heading', { name: config.prompt })).toBeInTheDocument();
    expect(syllableButton('BA')).toBeInTheDocument();
    expect(syllableButton('LA')).toBeInTheDocument();
  });

  it('monta a palavra ao escolher as sílabas na ordem', async () => {
    renderActivity();

    await userEvent.click(syllableButton('BA'));
    await userEvent.click(syllableButton('LA'));

    await waitFor(() =>
      expect(screen.getByRole('status', { name: /Palavra completa: BALA/i })).toBeInTheDocument(),
    );
  });

  it('conta o erro e mantém a sílaba disponível quando a ordem está errada', async () => {
    renderActivity();

    await userEvent.click(syllableButton('LA'));

    expect(screen.getByRole('alert')).toHaveTextContent(/não vem agora/i);
    // Errar não consome a sílaba: a criança pode tentar de novo.
    expect(syllableButton('LA')).toBeEnabled();
  });

  it('libera a próxima atividade só depois de concluir', async () => {
    renderActivity();

    expect(screen.queryByRole('link', { name: /PRÓXIMA/i })).not.toBeInTheDocument();

    await userEvent.click(syllableButton('BA'));
    await userEvent.click(syllableButton('LA'));

    expect(
      await screen.findByRole('link', { name: /PRÓXIMA/i }),
    ).toHaveAttribute('href', '/modulo/modulo-03/modulo-03-atividade-02');
  });

  it('reinicia a atividade e volta ao estado inicial', async () => {
    renderActivity();

    await userEvent.click(syllableButton('BA'));
    expect(screen.getByRole('status', { name: /Palavra em construção: BA/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Reiniciar atividade' }));

    expect(screen.getByRole('status', { name: /Palavra em construção: vazia/i })).toBeInTheDocument();
    expect(syllableButton('BA')).toBeEnabled();
  });

  it('distingue sílabas repetidas pelo índice', async () => {
    renderActivity({
      word: 'BANANA',
      syllables: ['BA', 'NA', 'NA'],
      prompt: 'MONTE A PALAVRA: BANANA',
    });

    await userEvent.click(syllableButton('BA'));

    const built = () => screen.queryByRole('status', { name: /BANA/i });

    // O banco é embaralhado e as duas "NA" têm o mesmo nome acessível, então o
    // teste tenta as duas. Errar bloqueia o próximo toque pelo tempo do
    // feedback, daí esperar o alerta sumir antes de seguir.
    for (const na of screen.getAllByRole('button', { name: 'Sílaba NA' })) {
      if (built()) break;
      await userEvent.click(na);
      if (!built()) {
        await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument(), {
          timeout: 3000,
        });
      }
    }

    expect(built()).toBeInTheDocument();

    // Só a ocorrência usada sai do jogo; a outra continua disponível.
    const after = screen.getAllByRole('button', { name: 'Sílaba NA' });
    expect(after.filter((button) => button.hasAttribute('disabled'))).toHaveLength(1);
    expect(after.filter((button) => !button.hasAttribute('disabled'))).toHaveLength(1);
  });

  it('expõe os botões só com ícone com nome acessível', () => {
    renderActivity();

    expect(screen.getByRole('button', { name: 'Reiniciar atividade' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir para o início' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /VOLTAR/i })).toHaveAttribute(
      'href',
      '/modulo/modulo-03',
    );
  });
});
