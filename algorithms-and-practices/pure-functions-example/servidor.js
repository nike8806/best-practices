var readline = require('readline');
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});
// Reading input
rl.on('line', function (line) {
    let strServer = line;
    let at = strServer.split(' ');
    console.log(getTimeSync([1, 2, 3]));
})

function getTimeSync(at) {
    let hoursMaxFactor = getMax(at);    
    hoursMax = hoursMaxFactor
    
    let indiceMax = 1
    for(let i=0; i<at.length; i++){
        if(at[i] % hoursMaxFactor !== 0 ){
            indiceMax++;
            hoursMax = hoursMaxFactor * indiceMax;
            i=0;
        }
    }
    return hoursMax;
}

function getMax(at){
    let max = parseInt(at[0]);
    for(let i =0; i<at.length; i++ ){
        if(parseInt(at[i]) > max){
            max = at[i];
        }
    }
    return max;
}