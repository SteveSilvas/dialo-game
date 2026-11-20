import { buildTrailPath } from './path';

const box = (top: number, bottom: number, left: number, centerX: number) => ({
  top,
  bottom,
  left,
  centerX,
});

/**
 * As caixas imitam a medição do DOM: o caminho tem de sair das coordenadas
 * reais, sem supor altura fixa de nó.
 */
describe('buildTrailPath', () => {
  it('liga dois módulos sem atividades com um pino vertical', () => {
    const d = buildTrailPath([
      { node: box(0, 80, 100, 180), activities: [] },
      { node: box(160, 240, 100, 180), activities: [] },
    ]);

    expect(d).toBe('M 180 80 L 180 160');
  });

  it('leva o tronco pela lateral e abre a barra das atividades', () => {
    const d = buildTrailPath([
      {
        node: box(0, 80, 100, 180),
        activities: [box(120, 150, 40, 60), box(120, 150, 100, 120)],
      },
      { node: box(200, 280, 100, 180), activities: [] },
    ]);

    expect(d).toBe(
      [
        // Tronco: sai do nó, encosta na lateral e desce até a barra.
        'M 180 80',
        'L 180 88',
        'L 24 88',
        'L 24 112',
        // Volta ao centro para entrar no módulo seguinte.
        'L 24 158',
        'L 180 158',
        'L 180 200',
        // Barra da linha e pino em cada atividade.
        'M 24 112',
        'L 120 112',
        'M 60 112',
        'L 60 120',
        'M 120 112',
        'L 120 120',
      ].join(' '),
    );
  });

  it('cria uma barra por linha quando as atividades quebram no celular', () => {
    const d = buildTrailPath([
      {
        node: box(0, 80, 100, 180),
        // Duas linhas: a segunda 40 px abaixo da primeira.
        activities: [box(120, 150, 40, 60), box(160, 190, 40, 60)],
      },
      { node: box(240, 320, 100, 180), activities: [] },
    ]);

    const bars = d.split(' M ').filter((segment) => segment.startsWith('24 '));
    expect(bars).toHaveLength(2);
    expect(d).toContain('L 24 112');
    expect(d).toContain('L 24 152');
  });

  it('acompanha a altura real dos nós, sem medida fixa', () => {
    const short = buildTrailPath([
      { node: box(0, 80, 100, 180), activities: [] },
      { node: box(160, 240, 100, 180), activities: [] },
    ]);

    // O mesmo nó com o título em duas linhas no celular: 40 px mais alto.
    const tall = buildTrailPath([
      { node: box(0, 120, 100, 180), activities: [] },
      { node: box(200, 280, 100, 180), activities: [] },
    ]);

    expect(short).toBe('M 180 80 L 180 160');
    expect(tall).toBe('M 180 120 L 180 200');
  });

  it('não desenha nada para uma trilha vazia ou de um nó só', () => {
    expect(buildTrailPath([])).toBe('');
    expect(buildTrailPath([{ node: box(0, 80, 100, 180), activities: [] }])).toBe('');
  });
});
