import {
  TRAIL_PATH,
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

  it('não cria link de atividade para módulo sem tela de player', () => {
    // Sem rota de player, o link cairia em 404; a trilha é o destino seguro.
    expect(isPlayableModule('modulo-02')).toBe(false);
    expect(activityPath('modulo-02', 'modulo-02-atividade-01')).toBe(TRAIL_PATH);
    expect(activityPath('modulo-03', 'modulo-03-atividade-01')).toBe(TRAIL_PATH);
  });
});
