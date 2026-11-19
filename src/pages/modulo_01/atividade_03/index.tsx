import ActivityGrid from "../../../components/ActivityGrid";
import { isVogal } from "../../../utils/validations";
import { generateAlphabetArray, generateSimbolsArray, shuffleArray } from "../../../utils/functions";

const buildOptions = (): string[] =>
    shuffleArray([...generateSimbolsArray(), ...generateAlphabetArray()]);

const Atividade03 = () => (
    <ActivityGrid
        activitySlug="atividade-03"
        title="SELECIONE AS VOGAIS"
        buildOptions={buildOptions}
        isValid={isVogal}
        backHref="/modulo-01/atividade-02"
        nextHref="/modulo-01/atividade-04"
    />
);

export default Atividade03;
