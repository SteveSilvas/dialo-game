import {
  generateAlphabetArray,
  generateRandomNumbersArray,
  generateSimbolsArray,
} from './functions';

describe('generateAlphabetArray', () => {
  it('retorna as 26 letras minúsculas em ordem', () => {
    const alfabeto = generateAlphabetArray();
    expect(alfabeto).toHaveLength(26);
    expect(alfabeto[0]).toBe('a');
    expect(alfabeto[25]).toBe('z');
    expect(new Set(alfabeto).size).toBe(26);
  });
});

describe('generateSimbolsArray', () => {
  it('retorna apenas símbolos (sem letras ou números)', () => {
    const simbolos = generateSimbolsArray();
    expect(simbolos.length).toBeGreaterThan(0);
    for (const simbolo of simbolos) {
      expect(simbolo).toMatch(/^[^a-zA-Z0-9]$/);
    }
  });
});

describe('generateRandomNumbersArray', () => {
  it('gera a quantidade pedida de números', () => {
    expect(generateRandomNumbersArray(33, 1, 33)).toHaveLength(33);
    expect(generateRandomNumbersArray(0, 1, 10)).toHaveLength(0);
  });

  it('respeita os limites min e max', () => {
    const numeros = generateRandomNumbersArray(200, 1, 33);
    for (const numero of numeros) {
      expect(Number.isInteger(numero)).toBe(true);
      expect(numero).toBeGreaterThanOrEqual(1);
      expect(numero).toBeLessThanOrEqual(33);
    }
  });

  it('inclui os extremos quando o intervalo é pequeno', () => {
    const numeros = generateRandomNumbersArray(50, 5, 6);
    for (const numero of numeros) {
      expect([5, 6]).toContain(numero);
    }
  });
});
