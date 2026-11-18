import { useState } from "react";
import { TiArrowLeftThick, TiArrowRightThick, TiHome, TiRefresh } from "react-icons/ti";
import BoxRow from "../../../components/BoxRow";
import CustomButton from "../../../components/Button";
import LabelValue from "../../../components/LabelValue";
import PanelPoints from "../../../components/PanelPoints";
import SymbolsGrid from "../../../components/SymbolsGrid";
import { useActivityProgress } from "../../../hooks/useActivityProgress";
import { generateAlphabetArray, generateSimbolsArray, shuffleArray } from "../../../utils/functions";
import { isConsoante } from "../../../utils/validations";
import './index.css';

const buildOptions = (): string[] =>
    shuffleArray([...generateAlphabetArray(), ...generateSimbolsArray()]);

const Atividade05 = () => {
    const {
        options,
        optionsFound,
        removing,
        clicksCount,
        errors,
        finish,
        selectOption,
        reset,
    } = useActivityProgress(buildOptions, isConsoante);
    const [draggingItem, setDraggingItem] = useState<string | null>(null);

    const handleDrop = () => {
        if (draggingItem) {
            selectOption(draggingItem);
        }
        setDraggingItem(null);
    }

    return (
        <main className="page">
            <div className="header-page-activity-05">
                <PanelPoints
                    hits={optionsFound.length}
                    errors={errors}
                    rounds={clicksCount}
                />

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
            <h1 className="title-ativity">GUARDE AS LETRAS NA CAIXA</h1>

            <section className="container-atividade-05">
                <SymbolsGrid
                    items={options}
                    removing={removing}
                    className="caixa-letras-atividade-05"
                    draggable
                    onDragStart={setDraggingItem}
                    onSelect={selectOption}
                />
                <div
                    className="caixa-letras-escolhidas-atividade-05"
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                >
                    <SymbolsGrid
                        items={optionsFound}
                        removing={removing}
                        className="caixa-letras-escolhidas-grid"
                    />
                </div>
            </section>

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
                    href="/modulo-01/atividade-04"
                    leftIcon={
                        <TiArrowLeftThick
                            style={{ left: '0.5rem', fontSize: '3rem', color: 'var(--infantil-6)' }}
                        />
                    }
                />
                {finish && (
                    <CustomButton
                        text="PRÓXIMA"
                        href="/modulo-01"
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

export default Atividade05;
