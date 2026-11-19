import { Link } from "react-router-dom";
import CustomButton from "../../../components/Button";
import { TiHome } from "react-icons/ti";
import BoxActivity from "../../../components/BoxActivity";
import activity01Letras from '../../../assets/modulo_01/atividade_01.png';
import activity02Numeros from '../../../assets/modulo_01/atividade_02_numeros.png';
import BoxRow from "../../../components/BoxRow";
const Modulo01Home = () => {

    return (
        <main className="page px-4 py-4 gap-3">
            <h1 className="text-lg sm:text-2xl md:text-3xl text-center">RECONHECER LETRAS</h1>
            <p className="text-center px-2 text-sm sm:text-base">
                VAMOS APRENDER A RECONHECER OS SÍMBOLOS?
            </p>
            <BoxRow
                justifyContent="center"
                width="100%"
                gap="1rem">
                <BoxActivity
                    alt="letras"
                    src={activity01Letras}
                    text="LETRAS"
                    navigateTo="/modulo-01/atividade-01"
                />
                <BoxActivity
                    alt="numeros"
                    src={activity02Numeros}
                    text="NÚMEROS"
                    navigateTo="/modulo-01/atividade-02"
                />
                <BoxActivity
                    alt="vogais"
                    src={activity01Letras}
                    text="VOGAIS"
                    navigateTo="/modulo-01/atividade-03"
                />
                <BoxActivity
                    alt="consoantes"
                    src={activity01Letras}
                    text="CONSOANTES"
                    navigateTo="/modulo-01/atividade-04"
                />
            </BoxRow>
            <BoxRow>
                <BoxActivity
                    alt="desafio"
                    src={activity01Letras}
                    text="DESAFIO"
                    navigateTo="/modulo-01/atividade-05"
                />
            </BoxRow>

            <BoxRow
                justifyContent="center"
                width="100%"
                gap="1rem">
                <CustomButton
                    href="/"
                    ariaLabel="Ir para o início"
                    leftIcon={
                        <TiHome className="text-2xl sm:text-3xl" style={{
                            color: 'white'
                        }} />}
                />
                <Link
                    className="button"
                    to="/modulo-01/atividade-01"
                >
                    INICIAR MÓDULO
                </Link>
            </BoxRow>
        </main>
    );
};
export default Modulo01Home;