export const isLetter = (option: string) => {
    return /^[a-z]$/.test(option);
}

export const isNumber = (option: string): boolean => {
    try {
        let numberParsed: number = Number(option);
        return !isNaN(numberParsed);
    } catch (ex) {
        console.error(ex);
        return false
    }
}

// Função para gerar um array de números aleatórios
export const generateRandomNumbersArray = (length: number, min: number, max: number): number[] => {
    const randomNumbers: number[] = [];
    for (let i = 0; i < length; i++) {
        const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
        randomNumbers.push(randomNumber);
    }
    return randomNumbers;
}

// Função para converter um array de números em um array de strings
export const numberArrayToStringArray = (numbersArray: number[]): string[] => {
    return numbersArray.map(num => num.toString());
}

export default {
    isLetter,
    isNumber,
    numberArrayToStringArray,
    generateRandomNumbersArray
}