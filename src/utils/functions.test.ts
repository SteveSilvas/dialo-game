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

  it('não repete números na mesma grade', () => {
    const numeros = generateRandomNumbersArray(33, 1, 33);
    expect(new Set(numeros).size).toBe(numeros.length);
  });

  it('nunca gera mais itens do que o tamanho do intervalo', () => {
    expect(generateRandomNumbersArray(200, 1, 33)).toHaveLength(33);
    expect(generateRandomNumbersArray(50, 5, 6)).toHaveLength(2);
  });

  it('respeita os limites min e max', () => {
    const numeros = generateRandomNumbersArray(33, 1, 33);
    for (const numero of numeros) {
      expect(Number.isInteger(numero)).toBe(true);
      expect(numero).toBeGreaterThanOrEqual(1);
      expect(numero).toBeLessThanOrEqual(33);
    }
  });

  it('inclui todos os valores quando o intervalo é pequeno', () => {
    const numeros = generateRandomNumbersArray(50, 5, 6);
    expect([...numeros].sort((a, b) => a - b)).toEqual([5, 6]);
  });
});
