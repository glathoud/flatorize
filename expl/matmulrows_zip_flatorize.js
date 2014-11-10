function expl_matmulrows_zip_flatorize()
{  
    // Give external access, for example to display source code.
    // Example of use: ../index.html

    var E = expl_matmulrows_zip_flatorize;
    E.symbol_matmulrows_zip_gen = symbol_matmulrows_zip_gen;
    E.symbol_matmulrows_zip     = symbol_matmulrows_zip;
    E.symbol_matrixrows         = symbol_matrixrows;
    E.symbol_sum                = symbol_sum;

    //#BEGIN_BODY
    var matmulrows_zip_342 = flatorize( 
        // note the :[type] declarations, ignored by `flatorize`
        // but useful later in asm.js or C contexts
        'a:[3 [4 double]],b:[4 [2 double]]->c:[3 [2 double]]'
        , function (a,b) { return symbol_matmulrows_zip_gen( a, b, 3, 4, 2 ); } 
    );

    // Wrapper

    function symbol_matmulrows_zip_gen( a, b, I, J, K ) 
    {
        // Create matrices of symbolic expressions (NOT numbers)
        var sym_a = symbol_matrixrows( a, I, J )
        ,   sym_b = symbol_matrixrows( b, J, K )
        ;
        // Multiply the symbolic matrices
        return symbol_matmulrows_zip( sym_a, sym_b );
    }

    // Core

    function symbol_matmulrows_zip( a, b )
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

    // Does this work?

    var a = [ [1,2,3,4], [5,6,7,8], [9,10,11,12] ]
    ,   b = [ [13,14], [15,16], [17,18], [19,20] ]
    ,   c = matmulrows_zip_342( a, b )
    ;
    //#END_BODY

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

    // More exports

    E.matmulrows_zip_342 = matmulrows_zip_342;

    // For `expl_run`

    return { name : 'c', obtained : c, expected : [[170,180],[426,452],[682,724]] };
}
