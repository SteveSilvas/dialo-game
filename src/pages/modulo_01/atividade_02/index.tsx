import ActivityGrid from "../../../components/ActivityGrid";
import { isNumber } from "../../../utils/validations";
import { generateRandomNumbersArray, generateSimbolsArray, shuffleArray } from "../../../utils/functions";

const buildOptions = (): string[] =>
    shuffleArray([...generateSimbolsArray(), ...generateRandomNumbersArray(33, 1, 33).map(num => num.toString())]);

const Atividade02 = () => (
    <ActivityGrid
        activitySlug="atividade-02"
        title="SELECIONE OS NÚMEROS"
        buildOptions={buildOptions}
        isValid={isNumber}
        backHref="/modulo-01"
        nextHref="/modulo-01/atividade-03"
    />
);

export default Atividade02;
