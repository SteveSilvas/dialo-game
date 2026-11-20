import { useState } from "react";
import { TiArrowLeftThick, TiArrowRightThick, TiHome, TiRefresh } from "react-icons/ti";
import BoxRow from "../../../components/BoxRow";
import CustomButton from "../../../components/Button";
import PanelPoints from "../../../components/PanelPoints";
import SymbolsGrid from "../../../components/SymbolsGrid";
import { useActivityProgress } from "../../../hooks/useActivityProgress";
import { useModuleCompletion } from "../../../hooks/useModuleCompletion";
import { useProgressReporter } from "../../../hooks/useProgressReporter";
import { generateAlphabetArray, generateSimbolsArray, shuffleArray } from "../../../utils/functions";
import type { ActivityResult } from "../../../utils/moduleSummary";
import { conclusionPath } from "../../../utils/paths";
import { isConsoante } from "../../../utils/validations";
import './index.css';

const MODULE_SLUG = 'modulo-01';
const ACTIVITY_SLUG = 'atividade-05';

const buildOptions = (): string[] =>
    shuffleArray([...generateAlphabetArray(), ...generateSimbolsArray()]);

const Atividade05 = () => {
    const reportProgress = useProgressReporter();
    const [lastResult, setLastResult] = useState<ActivityResult | null>(null);
    const {
        options,
        optionsFound,
        removing,
        clicksCount,
        errors,
        finish,
        selectOption,
        reset,
    } = useActivityProgress(buildOptions, isConsoante, (result) => {
        setLastResult({ activitySlug: ACTIVITY_SLUG, ...result, completed: true });
        reportProgress(ACTIVITY_SLUG, { ...result, completed: true });
    });
    const [draggingItem, setDraggingItem] = useState<string | null>(null);

    // Última atividade do módulo: concluí-la fecha o módulo e abre a tela de
    // conclusão. Se as outras atividades ainda não foram feitas, o botão segue
    // sendo "PRÓXIMA" e a criança volta à trilha.
    const completion = useModuleCompletion(MODULE_SLUG, lastResult);
    const moduleFinished = finish && completion.complete;

    const handleDrop = () => {
        if (draggingItem) {
            selectOption(draggingItem);
        }
        setDraggingItem(null);
    }

    const handleReset = () => {
        setLastResult(null);
        reset();
    };

    return (
        <main className="page px-2 py-4 gap-2 sm:gap-4">
            <div className="header-page-activity-05 gap-2">
                <PanelPoints
                    hits={optionsFound.length}
                    errors={errors}
                    rounds={clicksCount}
                />

                <CustomButton
                    className="refresh-button min-w-0"
                    onClick={handleReset}
                    ariaLabel="Reiniciar atividade"
                    leftIcon={
                        <TiRefresh
                            className="text-2xl sm:text-3xl"
                            style={{ color: 'var(--ink)' }}
                        />
                    }
                />
            </div>
            <h1 className="title-ativity text-base sm:text-xl md:text-2xl">GUARDE AS LETRAS NA CAIXA</h1>

            <section className="container-atividade-05">
                <SymbolsGrid
                    items={options}
                    removing={removing}
                    className="caixa-letras-atividade-05"
                    draggable
                    onDragStart={setDraggingItem}
                    onSelect={selectOption}
                    label="Símbolos da atividade"
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
                        label="Letras guardadas na caixa"
                    />
                </div>
            </section>

            <BoxRow justifyContent="space-evenly" width="100%" gap="0.5rem">
                <CustomButton
                    href="/"
                    ariaLabel="Ir para o início"
                    leftIcon={<TiHome className="text-2xl sm:text-3xl" style={{ color: 'var(--ink)' }} />}
                />
                <CustomButton
                    text="VOLTAR"
                    href="/modulo-01/atividade-04"
                    leftIcon={
                        <TiArrowLeftThick
                            className="text-2xl sm:text-3xl"
                            style={{ left: '0.5rem', color: 'var(--ink)' }}
                        />
                    }
                />
                {moduleFinished ? (
                    <CustomButton
                        text="CONCLUIR MÓDULO"
                        href={conclusionPath(MODULE_SLUG)}
                        state={{ lastResult }}
                        rightIcon={
                            <TiArrowRightThick
                                className="text-2xl sm:text-3xl"
                                style={{ color: 'var(--ink)' }}
                            />
                        }
                    />
                ) : (
                    finish && (
                        <CustomButton
                            text="PRÓXIMA"
                            href="/modulo-01"
                            rightIcon={
                                <TiArrowRightThick
                                    className="text-2xl sm:text-3xl"
                                    style={{ color: 'var(--ink)' }}
                                />
                            }
                        />
                    )
                )}
            </BoxRow>
        </main>
    );
};

export default Atividade05;
