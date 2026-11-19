import { render, screen } from '@testing-library/react';
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
