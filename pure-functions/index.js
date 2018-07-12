var readline = require('readline');
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

rl.on('line', function (line) {
    let N = parseInt(line);
    console.log(getPalindromo(N));
})

function getPalindromo(N) {
    if (isPalindromo(N)) {
        return N;
    } else {
        return searchNextPalindromo(N);
    }

}

function searchNextPalindromo(N){
    let M = N + 1;
    while(!isPalindromo(M)){
        M++;
    }
    return M;
}

function isPalindromo(N) {
    const strN = N.toString();
    const sizeN = strN.length - 1;
    for (let i = 0; i < sizeN / 2; i++) {
        if (strN[i] !== strN[sizeN - i]) {
            return false;
        }
    }
    return true;
}