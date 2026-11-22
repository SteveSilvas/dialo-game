import {
  activityPath,
  conclusionPath,
  isPlayableModule,
  modulePath,
} from './paths';

describe('paths', () => {
  it('mantém o endereço curto do módulo 01', () => {
    expect(modulePath('modulo-01')).toBe('/modulo-01');
  });

  it('usa a rota genérica para um módulo novo', () => {
    expect(modulePath('modulo-02')).toBe('/modulo/modulo-02');
    expect(conclusionPath('modulo-02')).toBe('/modulo/modulo-02/conclusao');
  });

  it('leva a atividade do módulo 01 para a tela dela', () => {
    expect(activityPath('modulo-01', 'atividade-03')).toBe('/modulo-01/atividade-03');
  });

  it('leva a atividade de módulo novo para a tela genérica', () => {
    expect(activityPath('modulo-02', 'modulo-02-atividade-01')).toBe(
      '/modulo/modulo-02/modulo-02-atividade-01',
    );
    expect(activityPath('modulo-03', 'modulo-03-atividade-01')).toBe(
      '/modulo/modulo-03/modulo-03-atividade-01',
    );
  });

  it('considera jogável o módulo 01, que tem telas escritas à mão', () => {
    expect(isPlayableModule({ slug: 'modulo-01', activities: [] })).toBe(true);
  });

  it('só considera jogável o módulo novo que tem atividade renderizável', () => {
    const buildWord = {
      slug: 'modulo-03-atividade-01',
      type: 'buildWord' as const,
      configJson: JSON.stringify({ word: 'BALA', syllables: ['BA', 'LA'] }),
    };
    const unknownType = {
      slug: 'modulo-02-atividade-01',
      type: 'selectSymbols' as const,
      configJson: JSON.stringify({ prompt: 'BOLA', answer: 'b' }),
    };

    expect(isPlayableModule({ slug: 'modulo-03', activities: [buildWord as never] })).toBe(true);
    // Config válida, mas sem componente na tela genérica: não pode virar link.
    expect(isPlayableModule({ slug: 'modulo-02', activities: [unknownType as never] })).toBe(
      false,
    );
    expect(isPlayableModule({ slug: 'modulo-02', activities: [] })).toBe(false);
  });
});
