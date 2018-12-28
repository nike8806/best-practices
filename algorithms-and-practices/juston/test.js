const ALPHABETH = 'sxocqnmwpfyheljrdgui';
const FOO_LETTERS = 'udxsmpf';

process.stdin.resume();
process.stdin.setEncoding("ascii");
var input = "";
process.stdin.on("data", function (chunk) {
    input += chunk;
});
process.stdin.on("end", function () {
    // now we can read/parse input
    const wordsLeft = input.split(' ');
    const words = [...new Set(wordsLeft)];
    main(words);
});

/**
 * Execute the program receive a words
 * @param {*} words 
 */
function main(words){
    let results = {
        prepositions: 0,
        verbs: 0,
        subjentiveVerbs: 0,
        vocabularyList: '',
        prettyNumbers: 0,
        notNumbers: 0,
        numbers: 0
    };
    let prettyNumbers = [];
    words.forEach(word => {
        let wordType = getWordType(word);
        if(wordType === 'preposition'){
            results.notNumbers++;
            results.prepositions++;
        }

        else if(wordType === 'verb' || wordType === 'subjuntiveVerb' ){
            results.notNumbers++;
            results.verbs++;
            if(wordType === 'subjuntiveVerb') {
                results.subjentiveVerbs++;
            }
        }
        else if(wordType === 'number' || wordType === 'prettyNumber'){
            results.numbers++;
            if(wordType === 'prettyNumber'){
                results.prettyNumbers++;
                console.log(results.prettyNumbers);
            }
        }
    });
    results.vocabularyList = getOrderedVocabulary(words);
    results.totalWords = words.length;
    printAnalysisResults(results);
}

/**
 * Function to order the vocabulary in base of Juston alphabeth
 * @param {Array} words Words to order
 * @returns {Array} newWords
 */
function getOrderedVocabulary(words) {
    const compareFunction = (a,b) => {
        if (a > b) {
            return 1;
          }
          if (a < b) {
            return -1;
          }
          // a must be equal to b
          return 0;
    }

    const newWords = words.sort(function (a, b) {
        const compareLength = (a.length > b.length) ? b.length : a.length;
        for(let i = 0; i <= compareLength; i ++){
            let isDifferent = compareFunction(ALPHABETH.indexOf(a[i]), ALPHABETH.indexOf(b[i]))
            if(isDifferent != 0){
                return isDifferent;
            }
        }
        return 0;
      });
    return newWords;
}
/**
 * getWordType
 * Function to get the Type of the word
 * @param {String} word word to classify and get the type
 * @returns {String} wordType
 */
function getWordType(word) {
    const wordFinishWithFooLetter = FOO_LETTERS.indexOf(word[word.length-1]) >= 0;
    const wordLengthIs6 = word.length === 6;
    const wordNotContainsULetter = word.indexOf('u') < 0;
    const isPreposition = wordLengthIs6 && wordFinishWithFooLetter && wordNotContainsULetter;

    const wordLengthIsEqualOrHigherThan6 = word.length >= 6;
    const wordEndsBarLetter = !wordFinishWithFooLetter;
    const isVerb = wordLengthIsEqualOrHigherThan6 && wordEndsBarLetter;

    const wordStartWithBarLetter = !(FOO_LETTERS.indexOf(word[0]) >= 0);
    const isSubjuntiveVerb = isVerb && wordStartWithBarLetter;

    if(isPreposition) {
        return 'preposition'
    }

    if(isVerb) {
        if(isSubjuntiveVerb){
            return 'subjuntiveVerb';
        }
        return 'verb';
    }
    // Is a number!!
   // const numberBase10 = getBase10NumberFromJuston(word);
    if((numberBase10 >= 81827) && (numberBase10 % 3 ===0) ){
        console.log(word);
        return 'prettyNumber';
    }
    console.log('NotPretty: ', word, numberBase10, (numberBase10 >= 81827 && (numberBase10 % 3 === 0 ), numberBase10/3));
    return 'number';
}

/**
 * getBase10NumberFromJuston
 * Function to convert a Juston number to base 10 Number
 * @param {*} justonNumber Juston number
 */
function getBase10NumberFromJuston(justonNumber){
    let number = 0;
    let factor = 1;
    for(let i = 0; i < justonNumber.length; i++){
        number = number + ALPHABETH.indexOf(justonNumber[i]) * factor;
        factor = factor * 20;
    }
    return number;
}

/**
 * Function to print the results
 * @param {*} results 
 */
function printAnalysisResults(results){
    console.log(`1) There are ${results.prepositions} prepositions in the text`);
    console.log(`2) There are ${results.verbs} verbs in the text`);
    console.log(`3) There are ${results.subjentiveVerbs} subjunctive verbs in the text`);
    console.log(`4) Vocabulary list: ${results.vocabularyList.join(' ')}`);
    console.log(`5) There are ${results.prettyNumbers} distinct pretty numbers in the text`);
    console.log(`5) There are ${results.notNumbers} NOT NUMBERS`);
    console.log(`5) There are ${results.numbers} distinct pretty numbers in the text`);
}
 