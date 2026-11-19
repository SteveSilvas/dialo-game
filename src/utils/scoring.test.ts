import { calculateStars, mergeBestAttempt } from './scoring';

describe('calculateStars', () => {
  it('sem acertos não dá estrela', () => {
    expect(calculateStars(0, 0)).toBe(0);
    expect(calculateStars(0, 3)).toBe(0);
  });

  it('sem erros dá três estrelas', () => {
    expect(calculateStars(5, 0)).toBe(3);
  });

  it('reduz conforme a taxa de erro', () => {
    expect(calculateStars(9, 1)).toBe(2);
    expect(calculateStars(5, 5)).toBe(1);
    expect(calculateStars(1, 2)).toBe(0);
  });
});

describe('mergeBestAttempt', () => {
  it('mantém o melhor placar', () => {
    expect(mergeBestAttempt(5, 1, 3, 0)).toEqual({ bestScore: 5, errors: 1 });
  });

  it('adota o novo placar quando é maior', () => {
    expect(mergeBestAttempt(3, 0, 5, 2)).toEqual({ bestScore: 5, errors: 2 });
  });

  it('no empate fica com menos erros', () => {
    expect(mergeBestAttempt(5, 4, 5, 1)).toEqual({ bestScore: 5, errors: 1 });
  });
});
