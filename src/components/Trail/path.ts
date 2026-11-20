export type TrailBox = {
  top: number;
  bottom: number;
  left: number;
  centerX: number;
};

export type TrailSegment = {
  /** Caixa do nó do módulo. */
  node: TrailBox;
  /** Caixas das atividades do módulo, na ordem de exibição. */
  activities: TrailBox[];
};

/** Recuo do tronco em relação ao ramo mais à esquerda e folga das dobras. */
const GUTTER = 16;

/** Atividades na mesma linha têm o mesmo `top`; tolera arredondamento. */
const ROW_TOLERANCE = 4;

const round = (value: number) => Math.round(value * 10) / 10;

const groupRows = (activities: TrailBox[]): TrailBox[][] =>
  activities.reduce<TrailBox[][]>((rows, box) => {
    const last = rows[rows.length - 1];
    if (last && Math.abs(last[0].top - box.top) < ROW_TOLERANCE) {
      last.push(box);
      return rows;
    }
    rows.push([box]);
    return rows;
  }, []);

/**
 * Caminho da trilha a partir das caixas medidas no DOM.
 *
 * O tronco desce pela lateral esquerda dos ramos, então nunca cruza um nó —
 * nem quando as atividades quebram em várias linhas no celular. Cada linha
 * ganha uma barra horizontal e um pino até cada atividade, e o tronco volta ao
 * centro para entrar no módulo seguinte. Como tudo sai da medição, o caminho
 * acompanha a altura real dos nós.
 */
export const buildTrailPath = (segments: TrailSegment[]): string => {
  const parts: string[] = [];
  const move = (x: number, y: number) => parts.push(`M ${round(x)} ${round(y)}`);
  const line = (x: number, y: number) => parts.push(`L ${round(x)} ${round(y)}`);

  segments.forEach(({ node, activities }, index) => {
    const next = segments[index + 1]?.node;
    const rows = groupRows(activities);

    if (rows.length === 0) {
      if (next) {
        move(node.centerX, node.bottom);
        line(node.centerX, next.top);
      }
      return;
    }

    const trunkX = Math.min(...activities.map((box) => box.left)) - GUTTER;
    const barY = (row: TrailBox[]) => row[0].top - GUTTER / 2;
    const entryY = node.bottom + GUTTER / 2;

    // Tronco: sai do nó, encosta na lateral e desce passando por cada barra.
    move(node.centerX, node.bottom);
    line(node.centerX, entryY);
    line(trunkX, entryY);
    rows.forEach((row) => line(trunkX, barY(row)));

    if (next) {
      const lastBottom = rows[rows.length - 1][0].bottom;
      const exitY = Math.min(lastBottom + GUTTER / 2, next.top - GUTTER / 2);

      line(trunkX, exitY);
      line(next.centerX, exitY);
      line(next.centerX, next.top);
    }

    // Barra de cada linha e um pino até o topo de cada atividade.
    rows.forEach((row) => {
      const y = barY(row);
      move(trunkX, y);
      line(row[row.length - 1].centerX, y);

      row.forEach((activity) => {
        move(activity.centerX, y);
        line(activity.centerX, activity.top);
      });
    });
  });

  return parts.join(' ');
};
