import { Routes, Route } from 'react-router-dom';
import App from "../App";
import Atividade01 from '../pages/modulo_01/atividade_01';
import Atividade02 from '../pages/modulo_01/atividade_02';
import Modulo01Home from '../pages/modulo_01/_home';


const AppRoutes = () => {
    return (
        <Routes >
            <Route path="/" element={<App />} />
            <Route path="/modulo-01/" element={<Modulo01Home />} />
            <Route path="/modulo-01/atividade-01" element={<Atividade01 />} />
            <Route path="/modulo-01/atividade-02" element={<Atividade02 />} />
            <Route path="/modulo-01/atividade-03" element={<App />} />
        </Routes>
    )
}

export default AppRoutes;