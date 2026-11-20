import {
  generateAlphabetArray,
  generateRandomNumbersArray,
  generateSimbolsArray,
  shuffleArray,
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

  it('nunca devolve posições vazias', () => {
    const numeros = generateRandomNumbersArray(33, 1, 33);
    expect(numeros).toHaveLength(33);
    expect(numeros.every((numero) => Number.isInteger(numero))).toBe(true);
  });
});

describe('shuffleArray', () => {
  it('não altera o array original', () => {
    const original = ['a', 'b', 'c'];
    shuffleArray(original);
    expect(original).toEqual(['a', 'b', 'c']);
  });

  it('mantém todos os itens', () => {
    const resultado = shuffleArray(['a', 'b', 'c', 'd']);
    expect([...resultado].sort()).toEqual(['a', 'b', 'c', 'd']);
  });

  it('distribui as posições sem viés grosseiro', () => {
    // Regressão: com `sort(() => Math.random() - 0.5)` o último item ficava
    // na última posição em ~50% das vezes. Tolerância folgada para não
    // tornar o teste instável, mas suficiente para pegar aquele viés.
    const rodadas = 6000;
    const ultimaPosicao = { a: 0, b: 0, c: 0 };
    const itens = ['a', 'b', 'c'];

    for (let i = 0; i < rodadas; i++) {
      const resultado = shuffleArray(itens);
      ultimaPosicao[resultado[2] as 'a' | 'b' | 'c'] += 1;
    }

    const esperado = rodadas / 3;
    for (const item of itens) {
      const desvio = Math.abs(ultimaPosicao[item as 'a' | 'b' | 'c'] - esperado) / esperado;
      expect(desvio).toBeLessThan(0.15);
    }
  });
});
