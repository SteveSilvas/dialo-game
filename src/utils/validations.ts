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

export const isVogal = (caracter: string) : boolean=>{
    return ['a','e', 'i', 'o', 'u'].includes(caracter.toLowerCase());
} 


export const isConsoante = (caracter: string): boolean => {
    const vogais = ['a', 'e', 'i', 'o', 'u'];
    const letra = caracter.toLowerCase();

    return /^[a-zA-Z]$/.test(letra) && !vogais.includes(letra);
}
export default {
    isLetter,
    isNumber,
}