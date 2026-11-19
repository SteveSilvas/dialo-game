import ActivityGrid from "../../../components/ActivityGrid";
import { isLetter } from "../../../utils/validations";
import { generateAlphabetArray, generateSimbolsArray, shuffleArray } from "../../../utils/functions";

const buildOptions = (): string[] =>
    shuffleArray([...generateSimbolsArray(), ...generateAlphabetArray()]);

const Atividade01 = () => (
    <ActivityGrid
        activitySlug="atividade-01"
        title="SELECIONE AS LETRAS"
        buildOptions={buildOptions}
        isValid={isLetter}
        backHref="/modulo-01"
        nextHref="/modulo-01/atividade-02"
    />
);

export default Atividade01;
