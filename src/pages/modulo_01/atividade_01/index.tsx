import { useEffect, useState } from "react";
import './index.css';
import selectSong from '../../../assets/select-sound-121244.mp3';
import errorSong from '../../../assets/error-8-206492.mp3';
import successSong from '../../../assets/goodresult-82807.mp3';
import { TiArrowLeftThick, TiArrowRightThick, TiHome, TiRefresh } from "react-icons/ti";
import CustomButton from "../../../components/Button";
import clickSong from '../../../assets/click-151673.mp3';
import LabelValue from "../../../components/LabelValue";
import BoxRow from "../../../components/BoxRow";
import { isLetter } from "../../../utils/validations";
import { generateAlphabetArray, generateSimbolsArray } from "../../../utils/functions";
import PanelPoints from "../../../components/PanelPoints";

const Atividade01 = () => {
    const [optionsSimbolsAndLetters, setOptionsSimbolsAndLetters] = useState<string[]>([]);
    const [optionsFound, setOptionsFound] = useState<string[]>([]);
    const [finish, setFinish] = useState<boolean>(false);
    const [removing, setRemoving] = useState<string | null>(null);
    const [clicksCount, setClicksCount] = useState<number>(0);

    useEffect(() => {
        setOptionsSimbolsAndLetters(buildArraySimbols());
    }, [0]);

    useEffect(() => {
        let hasFinish = optionsFound.length > 0
            && optionsSimbolsAndLetters.every(item => !isLetter(item));

        setFinish(hasFinish);
    }, [optionsFound]);

    useEffect(() => {
        if (finish === true)
            startVictorySound();
    }, [finish]);

    function buildArraySimbols(): string[] {
        const symbols: string[] = generateSimbolsArray();
        const letters: string[] = generateAlphabetArray();
        const combinedArray: string[] = [...symbols, ...letters];
        combinedArray.sort(() => Math.random() - 0.5);

        return combinedArray;
    }

    const verifyOptions = (option: string) => {
        if (isLetter(option)) {
            startSelectSound();
            setRemoving(option);
            setTimeout(() => {
                setOptionsFound([...optionsFound, option]);
                let options = [...optionsSimbolsAndLetters];
                options = options.filter(item => item !== option);
                setOptionsSimbolsAndLetters(options);
                setRemoving(null);
            }, 1000);
        }
        else {
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

    const renderButtonsSimbols = () => {

        return optionsSimbolsAndLetters.map((item: string, index: number) => (
            <button
                className={`button-simbols ${removing === item ? 'fade-out' : ''}`}
                key={index}
                onClick={() => verifyOptions(item)}
            >
                {item.toUpperCase()}
            </button>
        ));
    }

    const renderNextActivityButton = () => {
        return (
            <CustomButton
                text="PRÓXIMA"
                href="/modulo-01/atividade-02"
                rightIcon={
                    <TiArrowRightThick
                        style={{
                            fontSize: '3rem',
                            color: 'var(--infantil-6)'
                        }} />}
            />);
    }

    const startClickSound = () => {
        const clickAudio = new Audio(clickSong);
        clickAudio.play();
    }

    const handleRefreshClick = () => {
        startClickSound();
        setOptionsFound([]);
        setOptionsSimbolsAndLetters(buildArraySimbols());
    }

    return (
        <main className="page">
            <div className="header-page">
                <PanelPoints
                    hits={optionsFound.length}
                    errors={clicksCount - optionsFound.length}
                    rounds={clicksCount}
                />
                <h1 className="title-ativity">SELECIONE AS LETRAS</h1>

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

            <div className="simbols-container">
                {renderButtonsSimbols()}
            </div>

            <BoxRow
                justifyContent="space-evenly"
                width="80%">
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
                    href="/modulo-01"
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

export default Atividade01;
