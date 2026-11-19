import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CustomButton from './index';

describe('CustomButton', () => {
  it('renderiza <button type="button"> quando não há texto nem href', () => {
    render(<CustomButton leftIcon={<span data-testid="icone" />} />);

    const botao = screen.getByRole('button');
    expect(botao.tagName).toBe('BUTTON');
    expect(botao).toHaveAttribute('type', 'button');
  });

  it('dispara onClick ao clicar em um botão só com ícone', async () => {
    const onClick = jest.fn();
    render(<CustomButton onClick={onClick} leftIcon={<span data-testid="icone" />} />);

    await userEvent.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('ativa o botão só com ícone pelo teclado', async () => {
    const onClick = jest.fn();
    render(<CustomButton onClick={onClick} leftIcon={<span data-testid="icone" />} />);

    await userEvent.tab();
    expect(screen.getByRole('button')).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);

    await userEvent.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('expõe aria-label e esconde os ícones decorativos', () => {
    render(
      <CustomButton
        ariaLabel="Reiniciar atividade"
        leftIcon={<span data-testid="icone" />}
      />,
    );

    const botao = screen.getByRole('button', { name: 'Reiniciar atividade' });
    expect(botao).toHaveAttribute('aria-label', 'Reiniciar atividade');
    expect(screen.getByTestId('icone')).toHaveAttribute('aria-hidden', 'true');
  });

  it('repassa aria-pressed ao botão', () => {
    render(<CustomButton ariaLabel="Pausar som" ariaPressed leftIcon={<span />} />);

    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('renderiza um link com aria-label quando há href', () => {
    render(
      <MemoryRouter>
        <CustomButton href="/" ariaLabel="Ir para o início" leftIcon={<span />} />
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: 'Ir para o início' });
    expect(link).toHaveAttribute('href', '/');
  });
});
