export const playSound = (src: string) => {
    // O navegador rejeita play() quando o áudio não foi autorizado por um gesto.
    // Sem o catch, cada clique vira uma unhandled rejection no console.
    void new Audio(src).play().catch(() => undefined);
};
