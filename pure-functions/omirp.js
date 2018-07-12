var readline = require('readline');
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

rl.on('line', function (line) {
    let N = parseInt(line);
    console.log(isOmirp(N));
})

function isOmirp(N) {
    let inverso = getInverso(N);
    console.log(inverso);
    /*if(isPrimo(N)){
        return true
    }
    return false;*/
}

function isPrimo(N){
    for(let i = N; i >0; i--){
        if((i !=N ) && (i != 1) && (N % i == 0)){
            return false;
        }
    }
    return true;
}

function getInverso(number) {
    let reversed = 0;
    while(number > 0){
        reversed = number * 10;
        reversed = reversed % 10;
        number--;
    }
    return reversed;
}

