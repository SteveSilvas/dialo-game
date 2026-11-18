import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Atividade01 from './index';

const renderAtividade = () =>
  render(
    <MemoryRouter>
      <Atividade01 />
    </MemoryRouter>,
  );

describe('Atividade01 (SELECIONE AS LETRAS)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('mostra o título e a grade de símbolos', () => {
    renderAtividade();
    expect(
      screen.getByRole('heading', { name: /selecione as letras/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });

  it('conta a tentativa ao clicar em um símbolo incorreto', () => {
    renderAtividade();
    const tentativas = () =>
      screen.getByText('TENTATIVAS').previousSibling?.textContent;

    expect(tentativas()).toBe('0');

    const simbolo = screen
      .getAllByRole('button')
      .find((botao) => /^[^a-zA-Z0-9]$/.test(botao.textContent ?? ''));
    expect(simbolo).toBeDefined();

    fireEvent.click(simbolo as HTMLElement);

    expect(tentativas()).toBe('1');
  });

  it('não conta erro ao acertar uma letra', () => {
    renderAtividade();
    const erros = () => screen.getByText('ERROS').previousSibling?.textContent;
    const acertos = () => screen.getByText('ACERTOS').previousSibling?.textContent;

    const letra = screen
      .getAllByRole('button')
      .find((botao) => /^[A-Z]$/.test(botao.textContent ?? ''));

    fireEvent.click(letra as HTMLElement);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(acertos()).toBe('1');
    expect(erros()).toBe('0');
  });

  it('remove a letra correta da grade após a animação', () => {
    renderAtividade();
    const letra = screen
      .getAllByRole('button')
      .find((botao) => /^[A-Z]$/.test(botao.textContent ?? ''));
    expect(letra).toBeDefined();

    const totalAntes = screen.getAllByRole('button').length;
    fireEvent.click(letra as HTMLElement);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getAllByRole('button').length).toBe(totalAntes - 1);
  });
});
