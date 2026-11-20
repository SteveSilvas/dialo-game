import { Link, useParams } from "react-router-dom";
import CustomButton from "../../components/Button";
import { TiHome } from "react-icons/ti";
import BoxActivity from "../../components/BoxActivity";
import BoxRow from "../../components/BoxRow";
import activity01Letras from '../../assets/modulo_01/atividade_01.png';
import activity02Numeros from '../../assets/modulo_01/atividade_02_numeros.png';
import { useCatalog } from "../../hooks/useCatalog";
import { localModule } from "../../state/localTrail";
import { activityPath, conclusionPath } from "../../utils/paths";

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
    moduleSlug,
    maxStars,
}: {
    activity: TrailActivity;
    moduleSlug: string;
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
                    navigateTo={activityPath(moduleSlug, activity.slug)}
                />
            )}
            <Stars stars={activity.stars} max={maxStars} />
        </div>
    );
};

interface ModuleHomeProps {
    /** Módulo da trilha. A rota `/modulo/:moduleSlug` informa pelo parâmetro. */
    moduleSlug?: string;
}

/**
 * Home de um módulo: as atividades daquele módulo com estrelas e desbloqueio.
 * A trilha vem da API; sem resposta, cai no catálogo local do front.
 */
const ModuleHome = ({ moduleSlug = 'modulo-01' }: ModuleHomeProps) => {
    const params = useParams();
    const slug = params.moduleSlug ?? moduleSlug;

    const { modules, status } = useCatalog();
    const module = modules.find((item) => item.slug === slug);
    const local = localModule(slug);

    // Enquanto o catálogo carrega, mostra a trilha local sem estrelas para a
    // tela não piscar vazia; o conteúdo da API substitui em seguida.
    const activities: TrailActivity[] = module
        ? module.activities.map((activity) => ({
            slug: activity.slug,
            title: activity.title.toUpperCase(),
            stars: activity.progress?.stars ?? 0,
            // O servidor é quem decide o desbloqueio; a trilha local não tem
            // essa informação e por isso libera tudo.
            locked: !module.isUnlocked,
        }))
        : (local?.activities ?? []).map((activity) => ({
            ...activity,
            stars: 0,
            locked: false,
        }));

    const maxStars = module?.maxStars ?? 3;
    const isOffline = status === 'offline';
    const firstActivity = activities[0];
    const isComplete = Boolean(
        module && module.requiredTotal > 0 && module.requiredCompleted >= module.requiredTotal,
    );

    return (
        <main className="page px-4 py-4 gap-3">
            <h1 className="text-lg sm:text-2xl md:text-3xl text-center">
                {module?.title.toUpperCase() ?? local?.title ?? 'MÓDULO'}
            </h1>
            <p className="text-center px-2 text-sm sm:text-base">
                {module?.description?.toUpperCase() ??
                    local?.description ??
                    'ESTE MÓDULO AINDA ESTÁ SENDO PREPARADO.'}
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
                        moduleSlug={slug}
                        maxStars={maxStars}
                    />
                ))}
            </BoxRow>

            <BoxRow>
                {activities.slice(4).map((activity) => (
                    <ActivityCard
                        key={activity.slug}
                        activity={activity}
                        moduleSlug={slug}
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
                {isComplete ? (
                    <Link className="button" to={conclusionPath(slug)}>
                        VER CONCLUSÃO
                    </Link>
                ) : (
                    firstActivity && (
                        <Link className="button" to={activityPath(slug, firstActivity.slug)}>
                            INICIAR MÓDULO
                        </Link>
                    )
                )}
            </BoxRow>
        </main>
    );
};

export default ModuleHome;
