export const numberArrayToStringArray = (numbersArray: number[]): string[] => {
    return numbersArray.map(num => num.toString());
}


export default {
    numberArrayToStringArray,
}