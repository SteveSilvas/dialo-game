import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SymbolsGrid from './index';

describe('SymbolsGrid', () => {
  it('renderiza os itens em maiúsculas', () => {
    render(<SymbolsGrid items={['a', '@']} />);

    expect(screen.getByRole('button', { name: 'A' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '@' })).toBeInTheDocument();
  });

  it('avisa o item selecionado ao clicar', async () => {
    const onSelect = jest.fn();
    render(<SymbolsGrid items={['a']} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: 'A' }));

    expect(onSelect).toHaveBeenCalledWith('a');
  });

  it('preenche o dataTransfer no arraste, exigido por Firefox e Safari', () => {
    const onDragStart = jest.fn();
    render(
      <SymbolsGrid items={['a']} draggable onDragStart={onDragStart} />,
    );

    const setData = jest.fn();
    fireEvent.dragStart(screen.getByRole('button', { name: 'A' }), {
      dataTransfer: { setData },
    });

    expect(setData).toHaveBeenCalledWith('text/plain', 'a');
    expect(onDragStart).toHaveBeenCalledWith('a');
  });

  it('aplica a classe de saída aos itens em remoção', () => {
    render(<SymbolsGrid items={['a', 'b']} removing={['a']} />);

    expect(screen.getByRole('button', { name: 'A' })).toHaveClass('fade-out');
    expect(screen.getByRole('button', { name: 'B' })).not.toHaveClass('fade-out');
  });
});
