import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Trava o contraste WCAG AA da paleta. O tema é a fonte da verdade: se alguém
 * trocar uma cor ou voltar a usar texto claro sobre fundo pastel, este teste
 * aponta exatamente qual par quebrou.
 */
const THEME_CSS = readFileSync(join(__dirname, '../index.css'), 'utf8');

const readVar = (name: string): string => {
  const match = THEME_CSS.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match) throw new Error(`Cor não encontrada no tema: ${name}`);
  return match[1];
};

const relativeLuminance = (hex: string): number => {
  const value = hex.replace('#', '');
  const channels = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (foreground: string, background: string): number => {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const [light, dark] = a > b ? [a, b] : [b, a];
  return (light + 0.05) / (dark + 0.05);
};

const MIN_TEXT_CONTRAST = 4.5;
const MIN_GRAPHIC_CONTRAST = 3;

describe('contraste da paleta', () => {
  const ink = readVar('--ink');

  it('usa texto legível sobre cada fundo pastel', () => {
    const backgrounds = [
      '--infantil-1',
      '--infantil-2',
      '--infantil-3',
      '--infantil-4',
      '--infantil-5',
      '--infantil-6',
    ];

    for (const name of backgrounds) {
      const background = readVar(name);
      const ratio = contrast(ink, background);
      // Mensagem explícita para identificar o par que quebrou.
      expect({ pair: `${ink} sobre ${name}`, ok: ratio >= MIN_TEXT_CONTRAST }).toEqual({
        pair: `${ink} sobre ${name}`,
        ok: true,
      });
    }
  });

  it('mantém legíveis os estados de acerto e erro', () => {
    expect(contrast('#ffffff', '#1a7f37')).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
    expect(contrast('#ffffff', '#c1121f')).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
  });

  it('usa o mesmo tom escuro em ícones e texto, acima do mínimo gráfico', () => {
    expect(contrast(ink, readVar('--infantil-1'))).toBeGreaterThanOrEqual(
      MIN_GRAPHIC_CONTRAST,
    );
  });
});
