import { TiArrowLeftThick, TiArrowRightThick, TiHome, TiRefresh } from 'react-icons/ti';
import BoxRow from '../BoxRow';
import CustomButton from '../Button';
import LabelValue from '../LabelValue';
import PanelPoints from '../PanelPoints';
import SymbolsGrid from '../SymbolsGrid';
import { useActivityProgress } from '../../hooks/useActivityProgress';
import './index.css';

interface ActivityGridProps {
  title: string;
  buildOptions: () => string[];
  isValid: (option: string) => boolean;
  backHref: string;
  nextHref: string;
}

/**
 * Estrutura comum às atividades de seleção do módulo 01 (01 a 04):
 * painel de pontos, grade de símbolos, botões de navegação e conclusão.
 */
const ActivityGrid = ({
  title,
  buildOptions,
  isValid,
  backHref,
  nextHref,
}: ActivityGridProps) => {
  const {
    options,
    optionsFound,
    removing,
    clicksCount,
    errors,
    finish,
    selectOption,
    reset,
  } = useActivityProgress(buildOptions, isValid);

  return (
    <main className="page">
      <div className="header-page">
        <PanelPoints
          hits={optionsFound.length}
          errors={errors}
          rounds={clicksCount}
        />
        <h1 className="title-ativity">{title}</h1>

        <CustomButton
          className="refresh-button"
          leftIcon={
            <TiRefresh
              onClick={reset}
              style={{ fontSize: '3rem', color: 'white' }}
            />
          }
        />
      </div>

      <SymbolsGrid
        items={options}
        removing={removing}
        onSelect={selectOption}
      />

      <BoxRow justifyContent="space-evenly" width="80%">
        {finish && (
          <LabelValue value={clicksCount.toString()} text="TENTATIVAS" />
        )}
        <CustomButton
          href="/"
          leftIcon={<TiHome style={{ fontSize: '3rem', color: 'white' }} />}
        />
        <CustomButton
          text="VOLTAR"
          href={backHref}
          leftIcon={
            <TiArrowLeftThick
              style={{
                left: '0.5rem',
                fontSize: '3rem',
                color: 'var(--infantil-6)',
              }}
            />
          }
        />
        {finish && (
          <CustomButton
            text="PRÓXIMA"
            href={nextHref}
            rightIcon={
              <TiArrowRightThick
                style={{ fontSize: '3rem', color: 'var(--infantil-6)' }}
              />
            }
          />
        )}
      </BoxRow>
    </main>
  );
};

export default ActivityGrid;
