import React, { useEffect, useState } from "react";
import './index.css';
import selectSong from '../../../assets/select-sound-121244.mp3';
import errorSong from '../../../assets/error-8-206492.mp3';
import successSong from '../../../assets/goodresult-82807.mp3';
import { TiArrowLeftThick, TiArrowRightThick, TiHome, TiRefresh } from "react-icons/ti";
import CustomButton from "../../../components/Button";
import clickSong from '../../../assets/click-151673.mp3';
import LabelValue from "../../../components/LabelValue";
import BoxRow from "../../../components/BoxRow";
import { isConsoante } from "../../../utils/validations";
import { generateAlphabetArray, generateSimbolsArray } from "../../../utils/functions";
import PanelPoints from "../../../components/PanelPoints";

const Atividade05 = () => {
    const [optionsSimbolsAndNumbers, setOptionsSimbolsAndNumbers] = useState<string[]>([]);
    const [optionsFound, setOptionsFound] = useState<string[]>([]);
    const [finish, setFinish] = useState<boolean>(false);
    const [removing, setRemoving] = useState<string | null>(null);
    const [clicksCount, setClicksCount] = useState<number>(0);
    const [draggingItem, setDraggingItem] = useState<string | null>(null);

    useEffect(() => {
        setOptionsSimbolsAndNumbers(buildArraySimbols());
    }, []);

    useEffect(() => {
        let hasFinish = optionsFound.length > 0
            && optionsSimbolsAndNumbers.every(item => !isConsoante(item));
        setFinish(hasFinish);
    }, [optionsFound]);

    useEffect(() => {
        if (finish === true)
            startVictorySound();
    }, [finish]);

    function buildArraySimbols(): string[] {
        const combinedArray: string[] = [...generateAlphabetArray(), ...generateSimbolsArray()];
        combinedArray.sort(() => Math.random() - 0.5);
        return combinedArray;
    }

    const verifyOptions = (option: string) => {
        if (isConsoante(option)) {
            startSelectSound();
            setRemoving(option);
            setTimeout(() => {
                setOptionsFound([...optionsFound, option]);
                let options = [...optionsSimbolsAndNumbers];
                options = options.filter(item => item !== option);
                setOptionsSimbolsAndNumbers(options);
                setRemoving(null);
            }, 1000);
        } else {
            startErrorSound();
        }
        setClicksCount(clicksCount + 1);
    }

    const startSelectSound = () => {
        const selectAudio = new Audio(selectSong);
        selectAudio.play();
    }

    const startErrorSound = () => {
        const audioError = new Audio(errorSong);
        audioError.play();
    }

    const startVictorySound = () => {
        const successAudio = new Audio(successSong);
        successAudio.play();
    }

    const startClickSound = () => {
        const clickAudio = new Audio(clickSong);
        clickAudio.play();
    }

    const handleRefreshClick = () => {
        startClickSound();
        setClicksCount(0);
        setOptionsFound([]);
        setOptionsSimbolsAndNumbers(buildArraySimbols());
    }

    const handleDragStart = (item: string) => {
        setDraggingItem(item);
    }

    const handleDrop = (targetArray: string[], setTargetArray: React.Dispatch<React.SetStateAction<string[]>>) => {
        if (draggingItem && isConsoante(draggingItem)) {
            startSelectSound();
            setRemoving(draggingItem);
            setTimeout(() => {
                setTargetArray([...targetArray, draggingItem]);
                setOptionsSimbolsAndNumbers(prev => prev.filter(item => item !== draggingItem));
                setRemoving(null);
            }, 1000);
        } else {
            startErrorSound();
        }
        setClicksCount(clicksCount + 1);
        setDraggingItem(null);
    }

    const renderButtonsSimbols = (items: string[], isSource: boolean) => {
        return items.map((item: string, index: number) => (
            <button
                key={index}
                className={`button-simbols ${removing === item ? 'fade-out' : ''}`}
                draggable={isSource}
                onDragStart={() => isSource && handleDragStart(item)}
                onDrop={() => !isSource && handleDrop(optionsFound, setOptionsFound)}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => isSource && verifyOptions(item)}
            >
                {item.toUpperCase()}
            </button>
        ));
    }

    const renderNextActivityButton = () => {
        return (
            <CustomButton
                text="PRÓXIMA"
                href="/modulo-02/atividade-06"
                rightIcon={
                    <TiArrowRightThick
                        style={{
                            fontSize: '3rem',
                            color: 'var(--infantil-6)'
                        }} />}
            />
        );
    }

    return (
        <main className="page-activity-05">
            <div className="header-page-activity-05">
                <PanelPoints
                    hits={optionsFound.length}
                    errors={clicksCount - optionsFound.length}
                    rounds={clicksCount}
                />

                <CustomButton
                    className="refresh-button"
                    leftIcon={
                        <TiRefresh
                            onClick={handleRefreshClick}
                            style={{
                                fontSize: '3rem',
                                color: 'white'
                            }} />}
                />
            </div>
            <h1 className="title-ativity-01">GUARDE AS LETRAS NA CAIXA</h1>

            <section className="container-atividade-05">
                <div className="caixa-letras-atividade-05">
                    {renderButtonsSimbols(optionsSimbolsAndNumbers, true)}
                </div>
                <div className="scene">
                    <div className="cube">
                        <div className="face front">Front</div>
                        <div className="face back">Back</div>
                        <div className="face right">Right</div>
                        <div className="face left">Left</div>
                        <div className="face top caixa-letras-escolhidas-atividade-05"
                            onDrop={() => handleDrop(optionsFound, setOptionsFound)}
                            onDragOver={(e) => e.preventDefault()}
                        >
                            {renderButtonsSimbols(optionsFound, false)}
                        </div>
                        <div className="face bottom">Bottom</div>
                    </div>
                </div>
               
            </section>

            <BoxRow
                justifyContent="space-evenly"
                width="80%"
            >
                {finish && (
                    <LabelValue
                        value={clicksCount.toString()}
                        text="TENTATIVAS"
                    />)
                }
                <CustomButton
                    href="/"
                    leftIcon={
                        <TiHome style={{
                            fontSize: '3rem',
                            color: 'white'
                        }} />}
                />
                <CustomButton
                    text="VOLTAR"
                    href="/modulo-01/atividade-03"
                    leftIcon={
                        <TiArrowLeftThick style={{
                            left: '0.5rem',
                            fontSize: '3rem',
                            color: 'var(--infantil-6)'
                        }} />}
                />
                {finish && renderNextActivityButton()}
            </BoxRow>
        </main>
    );
};

export default Atividade05;
