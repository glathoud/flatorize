// Requires: flatorize.js & symbol_matmul.js & symbol_flatmatmul.js


function symbol_flatmatmul_inplace( a, b, c, I, J, K )
{
    return flatorize.inplace_array_output(
        symbol_flatmatmul_gen( a, b, I, J, K )
        , c
    );
}

(function unittest() {

    var F = flatorize;
       
    var flatmatmul_342_inplace = F( 
        // note the :[type] declarations, ignored by `flatorize`
        // but useful later in asm.js or C contexts
        'a:[12 double],b:[8 double],c:[6 double]->c:[6 double]'
        , function (a,b,c) {
            return symbol_flatmatmul_inplace( a, b, c, 3, 4, 2 );
        } 
    );
    
    // Does this work?

    var a = new Float64Array([
        1,2,3,4
        , 5,6,7,8
        , 9,10,11,12
    ])
    ,   b = new Float64Array([
        13,14
        , 15,16
        , 17,18
        , 19,20
    ])
    ,   c = new Float64Array( 3 * 2 )
    ;
    flatmatmul_342_inplace( a, b, c );

    JSON.stringify( Array.apply( null, c ) ) === JSON.stringify([
        1*13+2*15+3*17+4*19, 1*14+2*16+3*18+4*20
        , 5*13+6*15+7*17+8*19, 5*14+6*16+7*18+8*20
        , 9*13+10*15+11*17+12*19, 9*14+10*16+11*18+12*20
    ])  ||  null.bug;

    console.log('implementation: ' + flatmatmul_342_inplace.getDirect());

    // Speed test

    flatmatmul_342_inplace_direct = flatmatmul_342_inplace.getDirect();
    
    var N = 50000000;
    var start_ms = Date.now();
    for (var i = N; i--;)
        flatmatmul_342_inplace_direct( a, b, c );
    var duration_sec = (Date.now() - start_ms) / 1000;

    console.log(`speed ${(N/duration_sec).toPrecision(5)} = ${N} / ${duration_sec}`);
    
})();
