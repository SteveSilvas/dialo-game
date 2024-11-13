import { Link } from "react-router-dom";
import CustomButton from "../../../components/Button";
import { TiHome } from "react-icons/ti";
import BoxActivity from "../../../components/BoxActivity";
import activity01Letras from '../../../assets/modulo_01/atividade_01.png';
import activity02Numeros from '../../../assets/modulo_01/atividade_02_numeros.png';
import BoxRow from "../../../components/BoxRow";
const Modulo01Home = () => {

    return (
        <main className="page">
            <h1>RECONHECER LETRAS</h1>
            <p>
                VAMOS APRENDER A RECONHECER OS SÍMBOLOS?
            </p>
            <BoxRow
                justifyContent="center"
                width="80%"
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
                    src={activity02Numeros}
                    text="VOGAIS"
                    navigateTo="/modulo-01/atividade-03"
                />
                <BoxActivity
                    alt="consoantes"
                    src={activity02Numeros}
                    text="CONSOANTES"
                    navigateTo="/modulo-01/atividade-04"
                />
            </BoxRow>
            <BoxRow>
                <BoxActivity
                    alt="letras 2"
                    src={activity02Numeros}
                    text="Letras 2"
                    navigateTo="/modulo-01/atividade-05"
                />
            </BoxRow>

            <BoxRow
                justifyContent="space-between"
                width="45%">
                <CustomButton
                    href="/"
                    leftIcon={
                        <TiHome style={{
                            fontSize: '3rem',
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