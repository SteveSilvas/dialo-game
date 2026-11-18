export const isLetter = (option: string) => {
    return /^[a-z]$/.test(option);
}

export const isNumber = (option: string): boolean => {
    const trimmed = option.trim();
    if (trimmed === '') return false;
    return Number.isFinite(Number(trimmed));
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