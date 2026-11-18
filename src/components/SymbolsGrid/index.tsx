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
    <div className={`${className} gap-1 sm:gap-2`}>
      {items.map((item, index) => (
        <button
          key={`${item}-${index}`}
          className={`button-simbols h-10 w-10 text-2xl sm:h-14 sm:w-14 sm:text-3xl md:h-16 md:w-16 md:text-4xl ${removing === item ? 'fade-out' : ''}`}
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
