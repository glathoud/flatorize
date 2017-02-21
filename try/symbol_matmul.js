// Requires: flatorize.js

(function unittest() {

    var matmul_342 = flatorize( 
        // note the :[type] declarations, ignored by `flatorize`
        // but useful later in asm.js or C contexts
        'a:[3 [4 double]],b:[4 [2 double]]->c:[3 [2 double]]'
        , function (a,b) { return symbol_matmul_gen( a, b, 3, 4, 2 ); } 
    );

    // Does this work?

    var a = [ [1,2,3,4], [5,6,7,8], [9,10,11,12] ]
    ,   b = [ [13,14], [15,16], [17,18], [19,20] ]
    ,   c = matmul_342( a, b )
    ;
    
    JSON.stringify( c ) === JSON.stringify([
        [ 1*13+2*15+3*17+4*19, 1*14+2*16+3*18+4*20 ]
        , [ 5*13+6*15+7*17+8*19, 5*14+6*16+7*18+8*20 ]
        , [ 9*13+10*15+11*17+12*19, 9*14+10*16+11*18+12*20 ]
    ])  ||  null.bug;

    // Speed test

    var matmul_342_direct = matmul_342.getDirect();
    
    var N = 30000000;
    var start_ms = Date.now();
    for (var i = N; i--;)
        matmul_342_direct( a, b );
    var duration_sec = (Date.now() - start_ms) / 1000;

    console.log(`speed ${(N/duration_sec).toPrecision(5)} = ${N} / ${duration_sec}`);
    
})();

// Wrapper

function symbol_matmul_gen( a, b, I, J, K ) 
{
    // Create matrices of symbolic expressions (NOT numbers)
    var sym_a = symbol_matrixrows( a, I, J )
    ,   sym_b = symbol_matrixrows( b, J, K )
    ;
    // Multiply the symbolic matrices
    return symbol_matmul( sym_a, sym_b );
}

// Core

function symbol_matmul( a, b )
{
    return a.map( function (ra) { 
        return transpose( b ).map( function (cb) {
            return symbol_sum( 
                zip( ra, cb )
                    .map( function (xy) { 
                        return flatorize.expr( xy[ 0 ], '*', xy[ 1 ] ); 
                    } )
            );
        } );
    } );
}

// Tools

function symbol_matrixrows( name, nrow, ncol )
// m := [ [ m[0][0], m[0][1], m[0][2], ... ], 
//        [ m[1][0], m[1][1], m[1][2], ... ], 
//        ... 
//      ]
{
    return empty_array( nrow ).map( function ( tmp, r ) {

        return empty_array( ncol ).map( function ( tmp, c ) {

            return flatorize.part( flatorize.part( name, r ), c ); // e.g. m[r][c]
        });
    });
}

function empty_array( size )
{
    return new Array( size ).join( ',' ).split( ',' );
}

function symbol_sum( arr )
// sum( arr ) := arr[0] + arr[1] + ...
{
    return flatorize.expr.apply( null, arr.reduce( symbol_sum_step, [] ) );
    function symbol_sum_step( left, right ) 
    {
        return left.length  ?  left.concat( [ '+', right ] )  :  [ right ]; 
    }
}

// More tools

function transpose( mat )
{
    return zip.apply( null, mat );
}

function zip(/*...arguments...*/)
{
    var arg = [].slice.apply( arguments );
    if (!arg.length)
        return [];
    
    var n = arg[ 0 ].length
    , ret = new Array( n )
    ;
    for (var i = 0; i < n; i++)
        ret[ i ] = arg.map( function (x) { return x[i]; } );
    
    return ret;
}
