import type { ProgressSummary } from '../../utils/progress';
import './index.css';

type StatProps = {
    value: string;
    label: string;
    description: string;
};

const Stat = ({ value, label, description }: StatProps) => (
    <div className="progress-summary__stat">
        <strong aria-label={description}>{value}</strong>
        <span aria-hidden="true">{label}</span>
    </div>
);

/**
 * Resumo do progresso da criança na home. O número é anunciado por extenso
 * (`aria-label`) porque "2/3" sozinho não diz nada em um leitor de tela; o
 * texto visível fica curto para caber no celular.
 */
const ProgressSummaryPanel = ({ summary }: { summary: ProgressSummary }) => (
    <section className="progress-summary" aria-label="Resumo do progresso">
        <Stat
            value={`${summary.modulesCompleted}/${summary.modulesTotal}`}
            label="MÓDULOS"
            description={`${summary.modulesCompleted} de ${summary.modulesTotal} módulos concluídos`}
        />
        <Stat
            value={`${summary.stars}/${summary.maxStars}`}
            label="ESTRELAS"
            description={`${summary.stars} de ${summary.maxStars} estrelas`}
        />
        <Stat
            value={`${summary.activitiesCompleted}/${summary.activitiesTotal}`}
            label="ATIVIDADES"
            description={`${summary.activitiesCompleted} de ${summary.activitiesTotal} atividades concluídas`}
        />
    </section>
);

export default ProgressSummaryPanel;
