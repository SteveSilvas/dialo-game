import { useEffect, useMemo, useState } from "react";
import './index.css';
import selectSong from '../../../assets/select-sound-121244.mp3';
import errorSong from '../../../assets/error-8-206492.mp3';
import successSong from '../../../assets/goodresult-82807.mp3';
import { TiArrowLeftThick, TiArrowRightThick, TiHome, TiRefresh } from "react-icons/ti";
import CustomButton from "../../../components/Button";
import clickSong from '../../../assets/click-151673.mp3';
import LabelValue from "../../../components/LabelValue";
import BoxRow from "../../../components/BoxRow";
import { isNumber } from "../../../utils/validations";
import { generateRandomNumbersArray, generateSimbolsArray } from "../../../utils/functions";
import { playSound } from "../../../utils/sounds";
import PanelPoints from "../../../components/PanelPoints";

const Atividade02 = () => {
    const [optionsSimbolsAndNumbers, setOptionsSimbolsAndNumbers] = useState<string[]>(() => buildArraySimbols());
    const [optionsFound, setOptionsFound] = useState<string[]>([]);
    const [removing, setRemoving] = useState<string | null>(null);
    const [clicksCount, setClicksCount] = useState<number>(0);

    const finish = useMemo(
        () => optionsFound.length > 0
            && optionsSimbolsAndNumbers.every(item => !isNumber(item)),
        [optionsFound, optionsSimbolsAndNumbers]
    );

    useEffect(() => {
        if (finish)
            playSound(successSong);
    }, [finish]);

    function buildArraySimbols(): string[] {
        const symbols: string[] = generateSimbolsArray();
        const numbers: string[] = generateRandomNumbersArray(33, 1, 33).map(num => num.toString());
        const combinedArray: string[] = [...symbols, ...numbers];
        combinedArray.sort(() => Math.random() - 0.5);

        return combinedArray;
    }

    const verifyOptions = (option: string) => {
        if (isNumber(option)) {
            playSound(selectSong);
            setRemoving(option);
            setTimeout(() => {
                setOptionsFound([...optionsFound, option]);
                setOptionsSimbolsAndNumbers(optionsSimbolsAndNumbers.filter(item => item !== option));
                setRemoving(null);
            }, 1000);
        }
        else {
            playSound(errorSong);
        }
        setClicksCount(clicksCount + 1);
    }

    const renderButtonsSimbols = () => {

        return optionsSimbolsAndNumbers.map((item: string, index: number) => (
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
                href="/modulo-01/atividade-03"
                rightIcon={
                    <TiArrowRightThick
                        style={{
                            fontSize: '3rem',
                            color: 'var(--infantil-6)'
                        }} />}
            />);
    }

    const handleRefreshClick = () => {
        playSound(clickSong);
        setOptionsFound([]);
        setOptionsSimbolsAndNumbers(buildArraySimbols());
    }

    return (
        <main className="page">
            <div className="header-page">
                <PanelPoints
                    hits={optionsFound.length}
                    errors={clicksCount - optionsFound.length}
                    rounds={clicksCount}
                />
                <h1 className="title-ativity">SELECIONE OS NÚMEROS</h1>

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

export default Atividade02;
