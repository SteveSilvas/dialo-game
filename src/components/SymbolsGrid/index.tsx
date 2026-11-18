import React from 'react';

interface SymbolsGridProps {
  items: string[];
  removing?: string | null;
  className?: string;
  onSelect?: (item: string) => void;
  draggable?: boolean;
  onDragStart?: (item: string) => void;
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
}) => {
  return (
    <div className={className}>
      {items.map((item, index) => (
        <button
          key={`${item}-${index}`}
          className={`button-simbols ${removing === item ? 'fade-out' : ''}`}
          draggable={draggable}
          onDragStart={() => onDragStart?.(item)}
          onClick={() => onSelect?.(item)}
        >
          {item.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export default SymbolsGrid;
