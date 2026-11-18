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
        randomNumbers.push(pool.splice(index, 1)[0]);
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
    return [...items].sort(() => Math.random() - 0.5);
}
