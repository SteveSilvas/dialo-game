import { isConsoante, isLetter, isNumber, isVogal } from './validations';

describe('isLetter', () => {
  it('aceita letras minúsculas', () => {
    expect(isLetter('a')).toBe(true);
    expect(isLetter('z')).toBe(true);
  });

  it('rejeita letras maiúsculas', () => {
    expect(isLetter('A')).toBe(false);
    expect(isLetter('Z')).toBe(false);
  });

  it('rejeita números, símbolos e strings com mais de um caractere', () => {
    expect(isLetter('1')).toBe(false);
    expect(isLetter('@')).toBe(false);
    expect(isLetter('ab')).toBe(false);
    expect(isLetter('')).toBe(false);
  });
});

describe('isNumber', () => {
  it('aceita números inteiros e decimais', () => {
    expect(isNumber('1')).toBe(true);
    expect(isNumber('10')).toBe(true);
    expect(isNumber('-3')).toBe(true);
    expect(isNumber('1.5')).toBe(true);
  });

  it('aceita espaços nas bordas', () => {
    expect(isNumber('  7  ')).toBe(true);
  });

  it('rejeita string vazia ou só com espaços', () => {
    expect(isNumber('')).toBe(false);
    expect(isNumber('   ')).toBe(false);
  });

  it('rejeita valores não finitos', () => {
    expect(isNumber('Infinity')).toBe(false);
    expect(isNumber('-Infinity')).toBe(false);
    expect(isNumber('NaN')).toBe(false);
  });

  it('rejeita letras e símbolos', () => {
    expect(isNumber('a')).toBe(false);
    expect(isNumber('@')).toBe(false);
    expect(isNumber('1a')).toBe(false);
  });
});

describe('isVogal', () => {
  it('aceita vogais em qualquer caixa', () => {
    for (const vogal of ['a', 'e', 'i', 'o', 'u']) {
      expect(isVogal(vogal)).toBe(true);
      expect(isVogal(vogal.toUpperCase())).toBe(true);
    }
  });

  it('rejeita consoantes, números e símbolos', () => {
    expect(isVogal('b')).toBe(false);
    expect(isVogal('1')).toBe(false);
    expect(isVogal('@')).toBe(false);
  });
});

describe('isConsoante', () => {
  it('aceita consoantes em qualquer caixa', () => {
    expect(isConsoante('b')).toBe(true);
    expect(isConsoante('Z')).toBe(true);
  });

  it('rejeita vogais, números, símbolos e strings longas', () => {
    expect(isConsoante('a')).toBe(false);
    expect(isConsoante('E')).toBe(false);
    expect(isConsoante('1')).toBe(false);
    expect(isConsoante('@')).toBe(false);
    expect(isConsoante('bc')).toBe(false);
    expect(isConsoante('')).toBe(false);
  });
});
