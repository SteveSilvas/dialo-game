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

  it('agrupa os itens com nome acessível quando recebe um rótulo', () => {
    render(<SymbolsGrid items={['a']} label="Símbolos da atividade" />);

    expect(
      screen.getByRole('group', { name: 'Símbolos da atividade' }),
    ).toBeInTheDocument();
  });

  it('não vira grupo nomeado sem rótulo', () => {
    render(<SymbolsGrid items={['a']} />);

    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('mantém o foco na grade quando o item focado sai da lista', () => {
    const { rerender } = render(<SymbolsGrid items={['a', 'b', 'c']} />);

    screen.getByRole('button', { name: 'B' }).focus();
    expect(screen.getByRole('button', { name: 'B' })).toHaveFocus();

    // O item focado é removido depois da animação: o navegador jogaria o foco
    // no <body>, e quem joga pelo teclado perderia a posição.
    rerender(<SymbolsGrid items={['a', 'c']} />);

    expect(screen.getByRole('button', { name: 'C' })).toHaveFocus();
  });

  it('mantém o foco na grade quando o último item sai', () => {
    const { rerender } = render(
      <SymbolsGrid items={['a']} label="Símbolos da atividade" />,
    );

    screen.getByRole('button', { name: 'A' }).focus();
    rerender(<SymbolsGrid items={[]} label="Símbolos da atividade" />);

    expect(
      screen.getByRole('group', { name: 'Símbolos da atividade' }),
    ).toHaveFocus();
  });
});
