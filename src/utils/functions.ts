export const generateRandomNumbersArray = (length: number, min: number, max: number): number[] => {
    const pool: number[] = [];
    for (let value = min; value <= max; value++) {
        pool.push(value);
    }

    // Sorteia sem repetir: cada número aparece no máximo uma vez na grade.
    const randomNumbers: number[] = [];
    const total = Math.min(length, pool.length);
    for (let i = 0; i < total; i++) {
        const index = Math.floor(Math.random() * pool.length);
        const [sorteado] = pool.splice(index, 1);
        if (sorteado !== undefined) {
            randomNumbers.push(sorteado);
        }
    }
    return randomNumbers;
}

export const generateAlphabetArray = (): string[] => {
    return ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
}

export const generateSimbolsArray = (): string[] => {
    return ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '+', '=', '[', ']', '{', '}', '|', ';', ':', '<', '>', '/', '?', ',', '.', '~'];
      
}

export const shuffleArray = <T,>(items: T[]): T[] => {
    // Fisher-Yates. `sort` com comparador aleatório não gera distribuição
    // uniforme: com 3 itens, a última posição recebia 50% dos sorteios, o que
    // fazia o mesmo símbolo cair sempre no fim da grade.
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const atual = result[i]!;
        result[i] = result[j]!;
        result[j] = atual;
    }
    return result;
}
