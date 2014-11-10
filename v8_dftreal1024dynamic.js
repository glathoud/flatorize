load('log.js');
load('examples.js'); // to generate the DFT1024 implementation dynamically, and to get the `rand1024real()` vector for testing

// Code generation

var timeName = 'generate_dftreal1024flat';
time(timeName);
tryit_flatorize_dft( null, 1024 );
time(timeEnd);

// Speed test

var x = rand1024real();

var timeName = 'one_call_to_dftreal1024flat';
time(timeName);
var X = dftreal1024flat( x );
timeEnd(timeName);

var timeName = 'many_calls_to_dftreal1024flat';
time(timeName);
for (var i = 1000; i--;)   // up to about 250: no problem! starting with 275: sucks the whole system memory
    var X = dftreal1024flat( x );
timeEnd(timeName);

log();
log('X: '+X.slice(0,3)+' ...')
