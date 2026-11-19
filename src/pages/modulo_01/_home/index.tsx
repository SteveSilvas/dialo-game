import { Link } from "react-router-dom";
import CustomButton from "../../../components/Button";
import { TiHome } from "react-icons/ti";
import BoxActivity from "../../../components/BoxActivity";
import BoxRow from "../../../components/BoxRow";
import activity01Letras from '../../../assets/modulo_01/atividade_01.png';
import activity02Numeros from '../../../assets/modulo_01/atividade_02_numeros.png';
import { useCatalog } from "../../../hooks/useCatalog";

/**
 * Miniatura por atividade. A API manda título e ordem, mas não imagem: o mapa
 * fica no front e uma atividade nova cai na miniatura de letras.
 */
const THUMBNAILS: Record<string, { src: string; alt: string }> = {
    'atividade-01': { src: activity01Letras, alt: 'letras' },
    'atividade-02': { src: activity02Numeros, alt: 'números' },
    'atividade-03': { src: activity01Letras, alt: 'vogais' },
    'atividade-04': { src: activity01Letras, alt: 'consoantes' },
    'atividade-05': { src: activity01Letras, alt: 'desafio' },
};

const DEFAULT_THUMBNAIL = { src: activity01Letras, alt: 'atividade' };

/** Trilha local usada quando a API não responde. */
const FALLBACK_ACTIVITIES = [
    { slug: 'atividade-01', title: 'LETRAS', stars: 0, locked: false },
    { slug: 'atividade-02', title: 'NÚMEROS', stars: 0, locked: false },
    { slug: 'atividade-03', title: 'VOGAIS', stars: 0, locked: false },
    { slug: 'atividade-04', title: 'CONSOANTES', stars: 0, locked: false },
    { slug: 'atividade-05', title: 'DESAFIO', stars: 0, locked: false },
];

const Stars = ({ stars, max }: { stars: number; max: number }) => (
    <span className="activity-stars" aria-label={`${stars} de ${max} estrelas`}>
        {'★'.repeat(stars)}
        {'☆'.repeat(Math.max(max - stars, 0))}
    </span>
);

type TrailActivity = {
    slug: string;
    title: string;
    stars: number;
    locked: boolean;
};

/**
 * Atividade bloqueada não vira link: o servidor recusaria o progresso com 403,
 * e a criança chegaria a uma tela que ela não pode concluir.
 */
const ActivityCard = ({
    activity,
    maxStars,
}: {
    activity: TrailActivity;
    maxStars: number;
}) => {
    const thumb = THUMBNAILS[activity.slug] ?? DEFAULT_THUMBNAIL;

    return (
        <div className={`activity-card${activity.locked ? ' activity-card--locked' : ''}`}>
            {activity.locked ? (
                <div
                    className="box-container w-24 h-24 sm:w-28 sm:h-28 opacity-50"
                    aria-label={`${activity.title} bloqueada`}
                    role="img"
                >
                    <img src={thumb.src} className="box-image" alt="" />
                    <label>🔒</label>
                </div>
            ) : (
                <BoxActivity
                    alt={thumb.alt}
                    src={thumb.src}
                    text={activity.title}
                    navigateTo={`/modulo-01/${activity.slug}`}
                />
            )}
            <Stars stars={activity.stars} max={maxStars} />
        </div>
    );
};

const Modulo01Home = () => {
    const { modules, status } = useCatalog();
    const module = modules.find((item) => item.slug === 'modulo-01');

    // Enquanto o catálogo carrega, mostra a trilha local sem estrelas para a
    // tela não piscar vazia; o conteúdo da API substitui em seguida.
    const activities = module
        ? module.activities.map((activity) => ({
            slug: activity.slug,
            title: activity.title.toUpperCase(),
            stars: activity.progress?.stars ?? 0,
            // O servidor é quem decide o desbloqueio; a trilha local não tem
            // essa informação e por isso libera tudo.
            locked: !module.isUnlocked,
        }))
        : FALLBACK_ACTIVITIES;

    const maxStars = module?.maxStars ?? 3;
    const isOffline = status === 'offline';

    return (
        <main className="page px-4 py-4 gap-3">
            <h1 className="text-lg sm:text-2xl md:text-3xl text-center">
                {module?.title.toUpperCase() ?? 'RECONHECER LETRAS'}
            </h1>
            <p className="text-center px-2 text-sm sm:text-base">
                {module?.description?.toUpperCase() ??
                    'VAMOS APRENDER A RECONHECER OS SÍMBOLOS?'}
            </p>

            {module && (
                <p className="text-center text-sm" role="status">
                    {module.stars} de {module.activities.length * maxStars} estrelas
                    {' · '}
                    {module.requiredCompleted}/{module.requiredTotal} atividades concluídas
                </p>
            )}

            {isOffline && (
                <p className="text-center text-sm" role="status">
                    Jogando sem conexão com o servidor: o progresso fica neste aparelho.
                </p>
            )}

            <BoxRow justifyContent="center" width="100%" gap="1rem">
                {activities.slice(0, 4).map((activity) => (
                    <ActivityCard
                        key={activity.slug}
                        activity={activity}
                        maxStars={maxStars}
                    />
                ))}
            </BoxRow>

            <BoxRow>
                {activities.slice(4).map((activity) => (
                    <ActivityCard
                        key={activity.slug}
                        activity={activity}
                        maxStars={maxStars}
                    />
                ))}
            </BoxRow>

            <BoxRow justifyContent="center" width="100%" gap="1rem">
                <CustomButton
                    href="/"
                    ariaLabel="Ir para o início"
                    leftIcon={
                        <TiHome className="text-2xl sm:text-3xl" style={{
                            color: 'var(--ink)'
                        }} />}
                />
                <Link className="button" to="/modulo-01/atividade-01">
                    INICIAR MÓDULO
                </Link>
            </BoxRow>
        </main>
    );
};
export default Modulo01Home;
