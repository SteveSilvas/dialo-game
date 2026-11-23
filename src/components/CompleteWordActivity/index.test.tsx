import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CompleteWordActivity from './index';
import type { CompleteWordConfig } from '../../utils/activityConfig';

const config: CompleteWordConfig = {
  kind: 'completeWord',
  prompt: 'QUAL SÍLABA FALTA?',
  word: 'BALA',
  syllables: ['BA', 'LA'],
  missingIndex: 0,
  answer: 'BA',
  options: ['BA', 'PA', 'MA'],
  speak: 'BALA',
  emoji: '🍬',
};

const renderActivity = (overrides: Partial<CompleteWordConfig> = {}) =>
  render(
    <MemoryRouter>
      <CompleteWordActivity
        moduleSlug="modulo-04"
        activitySlug="modulo-04-atividade-01"
        backHref="/modulo/modulo-04"
        nextHref="/modulo/modulo-04/modulo-04-atividade-02"
        config={{ ...config, ...overrides }}
      />
    </MemoryRouter>,
  );

const optionButton = (text: string) =>
  screen.getByRole('button', { name: `Sílaba ${text}` });

describe('CompleteWordActivity', () => {
  it('mostra o enunciado, a figura e as opções', () => {
    renderActivity();

    expect(screen.getByRole('heading', { name: config.prompt })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'BALA' })).toBeInTheDocument();
    expect(optionButton('BA')).toBeInTheDocument();
    expect(optionButton('PA')).toBeInTheDocument();
    expect(optionButton('MA')).toBeInTheDocument();
  });

  it('esconde só a sílaba que falta e mostra as demais', () => {
    renderActivity();

    const slots = screen.getByRole('status', { name: /Palavra incompleta/i });
    // A palavra é BALA com a primeira sílaba oculta: "?" e "LA".
    expect(slots).toHaveTextContent('?');
    expect(slots).toHaveTextContent('LA');
    expect(slots).not.toHaveTextContent('BA');
  });

  it('esconde a sílaba do meio quando missingIndex aponta para ela', () => {
    renderActivity({
      word: 'SAPATO',
      syllables: ['SA', 'PA', 'TO'],
      missingIndex: 1,
      answer: 'PA',
      options: ['PA', 'PO', 'PE'],
    });

    const slots = screen.getByRole('status', { name: /Palavra incompleta/i });
    expect(slots).toHaveTextContent('SA');
    expect(slots).toHaveTextContent('TO');
    expect(slots).not.toHaveTextContent('PA');
  });

  it('completa a palavra ao escolher a sílaba certa', async () => {
    renderActivity();

    await userEvent.click(optionButton('BA'));

    await waitFor(() =>
      expect(
        screen.getByRole('status', { name: /Palavra completa: BALA/i }),
      ).toBeInTheDocument(),
    );
  });

  it('conta o erro e devolve as opções depois do retorno', async () => {
    renderActivity();

    await userEvent.click(optionButton('PA'));

    expect(screen.getByRole('alert')).toHaveTextContent(/não forma a palavra/i);
    // Durante o retorno de erro as opções ficam desabilitadas: um botão que
    // aceita o toque e o descarta é pior do que um botão visivelmente travado.
    expect(optionButton('PA')).toBeDisabled();
    expect(optionButton('BA')).toBeDisabled();

    // Passado o retorno, errar não consome a opção: a criança tenta de novo.
    await waitFor(() => expect(optionButton('BA')).toBeEnabled());
    expect(optionButton('PA')).toBeEnabled();
  });

  it('libera a próxima atividade só depois de concluir', async () => {
    renderActivity();

    expect(screen.queryByRole('link', { name: 'PRÓXIMA' })).not.toBeInTheDocument();

    await userEvent.click(optionButton('BA'));

    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'PRÓXIMA' })).toBeInTheDocument(),
    );
  });

  it('reinicia a atividade e volta ao estado inicial', async () => {
    renderActivity();

    await userEvent.click(optionButton('BA'));

    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'PRÓXIMA' })).toBeInTheDocument(),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Reiniciar atividade' }));

    expect(screen.queryByRole('link', { name: 'PRÓXIMA' })).not.toBeInTheDocument();
    expect(
      screen.getByRole('status', { name: /Palavra incompleta/i }),
    ).toBeInTheDocument();
    expect(optionButton('BA')).toBeEnabled();
  });

  it('expõe os botões só com ícone com nome acessível', () => {
    renderActivity();

    expect(screen.getByRole('button', { name: 'Reiniciar atividade' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir para o início' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'VOLTAR' })).toBeInTheDocument();
  });
});
