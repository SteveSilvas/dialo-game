import React, { useLayoutEffect, useRef } from 'react';

interface SymbolsGridProps {
  items: string[];
  removing?: string[];
  className?: string;
  onSelect?: (item: string) => void;
  draggable?: boolean;
  onDragStart?: (item: string) => void;
  /** Nome do grupo para leitores de tela (e para os testes de ponta a ponta). */
  label?: string;
}

/**
 * Grade de botões de símbolos/letras/números usada por todas as atividades.
 * Em modo `draggable` os itens podem ser arrastados (atividade 05).
 */
const SymbolsGrid: React.FC<SymbolsGridProps> = ({
  items,
  removing,
  className = 'simbols-container',
  onSelect,
  draggable = false,
  onDragStart,
  label,
}) => {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const focusedIndexRef = useRef<number | null>(null);

  // O item escolhido sai da grade depois da animação, e o navegador devolve o
  // foco ao <body>: quem joga pelo teclado teria de recomeçar o Tab do topo da
  // página a cada acerto. Aqui o foco vai para o vizinho mais próximo — ou para
  // a própria grade, quando o último item sai e o foco não tem mais onde ficar.
  //
  // `useLayoutEffect` e não `useEffect`: a remoção do item focado zera o foco
  // no mesmo quadro, e esperar o efeito comum deixaria um instante com o foco
  // no <body> — tempo de sobra para um Tab do usuário cair fora da grade.
  useLayoutEffect(() => {
    const index = focusedIndexRef.current;
    if (index === null) return;
    if (document.activeElement && document.activeElement !== document.body) return;

    const buttons = gridRef.current?.querySelectorAll('button');
    if (!buttons) return;

    if (buttons.length > 0) {
      buttons[Math.min(index, buttons.length - 1)]?.focus();
      return;
    }

    gridRef.current?.focus();
  }, [items]);

  return (
    <div
      ref={gridRef}
      className={`${className} gap-1 sm:gap-2`}
      role={label ? 'group' : undefined}
      aria-label={label}
      tabIndex={label ? -1 : undefined}>
      {items.map((item, index) => (
        <button
          key={`${item}-${index}`}
          className={`button-simbols h-10 w-10 text-2xl sm:h-14 sm:w-14 sm:text-3xl md:h-16 md:w-16 md:text-4xl ${removing?.includes(item) ? 'fade-out' : ''}`}
          draggable={draggable}
          onFocus={() => {
            focusedIndexRef.current = index;
          }}
          onDragStart={(event) => {
            // Firefox e Safari só iniciam o arraste se o dataTransfer receber
            // algum dado; sem isso o drop nunca dispara nesses navegadores.
            event.dataTransfer?.setData('text/plain', item);
            onDragStart?.(item);
          }}
          onClick={() => onSelect?.(item)}
        >
          {item.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export default SymbolsGrid;
