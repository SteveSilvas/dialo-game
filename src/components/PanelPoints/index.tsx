import React from 'react';
import './index.css';
import LabelValue from '../LabelValue';
import BoxRow from '../BoxRow';

interface PanelPointsProps {
    hits: number;
    errors: number;
    rounds: number;
}
const PanelPoints: React.FC<PanelPointsProps> = ({
    hits,
    errors,
    rounds,
}) => {

    return (
        <BoxRow
            gap='4px'
        >
            <LabelValue
                text="ACERTOS"
                value={hits.toString()}
                type='hits'
            />
            <LabelValue
                text="ERROS"
                value={errors.toString()}
                type='errors'
            />
            <LabelValue
                text="TENTATIVAS"
                value={rounds.toString()}
            />
        </BoxRow>
    )
};
export default PanelPoints;