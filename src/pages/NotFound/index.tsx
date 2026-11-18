import { Link } from "react-router-dom";
import { TiHome } from "react-icons/ti";

const NotFound = () => {
    return (
        <main className="page">
            <h1>PÁGINA NÃO ENCONTRADA</h1>
            <p>A atividade que você procura ainda não está disponível.</p>
            <Link className="button" to="/">
                <TiHome style={{ fontSize: '3rem', color: 'white' }} />
                VOLTAR AO INÍCIO
            </Link>
        </main>
    );
};

export default NotFound;
