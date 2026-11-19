import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ActivityGrid from './index';
import { isLetter } from '../../utils/validations';

const renderGrid = () =>
  render(
    <MemoryRouter>
      <ActivityGrid
        title="SELECIONE AS LETRAS"
        buildOptions={() => ['A', '@']}
        isValid={isLetter}
        backHref="/modulo-01"
        nextHref="/modulo-01/atividade-02"
      />
    </MemoryRouter>,
  );

describe('ActivityGrid', () => {
  it('expõe botões só com ícone com nome acessível e alcançáveis por Tab', async () => {
    renderGrid();

    const reiniciar = screen.getByRole('button', { name: 'Reiniciar atividade' });
    const inicio = screen.getByRole('link', { name: 'Ir para o início' });

    await userEvent.tab();
    expect(reiniciar).toHaveFocus();
    expect(inicio).toBeInTheDocument();
  });

  it('não repete o rótulo TENTATIVAS ao concluir a atividade', async () => {
    render(
      <MemoryRouter>
        <ActivityGrid
          title="SELECIONE AS LETRAS"
          buildOptions={() => ['a', '@']}
          isValid={isLetter}
          backHref="/modulo-01"
          nextHref="/modulo-01/atividade-02"
        />
      </MemoryRouter>,
    );

    // Último item válido: após a animação de saída a atividade é concluída.
    await userEvent.click(screen.getByRole('button', { name: 'A' }));
    await waitFor(
      () => expect(screen.getByRole('link', { name: 'PRÓXIMA' })).toBeInTheDocument(),
      { timeout: 3000 },
    );

    // O painel de pontos já mostra TENTATIVAS; o rodapé repetia o mesmo valor.
    expect(screen.getAllByText('TENTATIVAS')).toHaveLength(1);
  });

  it('reinicia a atividade pelo teclado', async () => {
    renderGrid();

    await userEvent.click(screen.getByRole('button', { name: 'A' }));
    expect(screen.getByText('TENTATIVAS').previousSibling?.textContent).toBe(
      '1',
    );

    const reiniciar = screen.getByRole('button', { name: 'Reiniciar atividade' });
    reiniciar.focus();
    await userEvent.keyboard('{Enter}');

    expect(screen.getByText('TENTATIVAS').previousSibling?.textContent).toBe(
      '0',
    );
  });
});
