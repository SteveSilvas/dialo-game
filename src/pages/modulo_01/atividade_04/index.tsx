import ActivityGrid from "../../../components/ActivityGrid";
import { isConsoante } from "../../../utils/validations";
import { generateAlphabetArray, generateSimbolsArray, shuffleArray } from "../../../utils/functions";

const buildOptions = (): string[] =>
    shuffleArray([...generateSimbolsArray(), ...generateAlphabetArray()]);

const Atividade04 = () => (
    <ActivityGrid
        activitySlug="atividade-04"
        title="SELECIONE AS CONSOANTES"
        buildOptions={buildOptions}
        isValid={isConsoante}
        backHref="/modulo-01/atividade-03"
        nextHref="/modulo-01/atividade-05"
    />
);

export default Atividade04;
