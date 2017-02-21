// Requires: flatorize.js & symbol_matmul.js

(function unittest() {

    var flatmatmul_342 = flatorize( 
        // note the :[type] declarations, ignored by `flatorize`
        // but useful later in asm.js or C contexts
        'a:[12 double],b:[8 double]->c:[6 double]'
        , function (a,b) { return symbol_flatmatmul_gen( a, b, 3, 4, 2 ); } 
    );

    // Does this work?

    var a = [ 1,2,3,4
              , 5,6,7,8
              , 9,10,11,12
            ]
    ,   b = [ 13,14
              , 15,16
              , 17,18
              , 19,20
            ]
    ,   c = flatmatmul_342( a, b )
    ;
    
    JSON.stringify( c ) === JSON.stringify([
        1*13+2*15+3*17+4*19, 1*14+2*16+3*18+4*20
        , 5*13+6*15+7*17+8*19, 5*14+6*16+7*18+8*20
        , 9*13+10*15+11*17+12*19, 9*14+10*16+11*18+12*20
    ])  ||  null.bug;

    // Speed test

    flatmatmul_342_direct = flatmatmul_342.getDirect();
    
    var N = 40000000;
    var start_ms = Date.now();
    for (var i = N; i--;)
        var c = flatmatmul_342_direct( a, b );
    var duration_sec = (Date.now() - start_ms) / 1000;

    console.log(`speed ${(N/duration_sec).toPrecision(5)} = ${N} / ${duration_sec}`);
    
})();

function symbol_flatmatmul_gen( a, b, I, J, K )
{
    // Create 2-D matrices of symbolic expressions (NOT numbers)
    var sym_a = flatorize.matrix_of_array( a, [ I, J ] )
    ,   sym_b = flatorize.matrix_of_array( b, [ J, K ] )

    // Multiply in 2-D space
    ,   sym_c = symbol_matmul( sym_a, sym_b )
    ;
    // Come back to 1-D space
    return flatorize.array_of_matrix( sym_c, [ I, K ] );
}
