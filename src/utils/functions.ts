
export const generateRandomNumbersArray = (length: number, min: number, max: number): number[] => {
    const randomNumbers: number[] = [];
    for (let i = 0; i < length; i++) {
        const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
        randomNumbers.push(randomNumber);
    }
    return randomNumbers;
}

export const generateAlphabetArray = (): string[] => {
    return ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
}

export const generateSimbolsArray = (): string[] => {
    return ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '+', '=', '[', ']', '{', '}', '|', ';', ':', '<', '>', '/', '?', ',', '.', '~'];
      
}
export default {
    generateRandomNumbersArray,
    generateAlphabetArray,
    generateSimbolsArray,
}