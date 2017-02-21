var fastmath2d;

(function fm2d_unittest() {

    if ('undefined' === typeof flatorize)
        setTimeout( fm2d_unittest_impl, 100 );
    else
        fm2d_unittest_impl();

    function fm2d_unittest_impl()
    {
        var F = flatorize;
        
        var flatmatmul_inplace_342 = fm2d_flatmatmul_inplace_of_ijk( 3, 4, 2 );

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
        flatmatmul_inplace_342( a, b, c );

        JSON.stringify( Array.apply( null, c ) ) === JSON.stringify([
            1*13+2*15+3*17+4*19, 1*14+2*16+3*18+4*20
            , 5*13+6*15+7*17+8*19, 5*14+6*16+7*18+8*20
            , 9*13+10*15+11*17+12*19, 9*14+10*16+11*18+12*20
        ])
            ||  null.bug
        ;

        fastmath2d = true;
    }
    
})();

// ---------- Top-level API

function fm2d_flatmatmul_inplace_of_ijk( /*integer*/I, /*integer*/J, /*integer*/K )
{
    var a_n = I*J
    ,   b_n = J*K
    ,   c_n = I*K
    ,   key = [ I, J, K ].join( '#' )
    ;
    if (!(key in fm2d_flatmatmul_inplace_of_ijk))
    {
        var wrapper = flatorize(
                
            // note the :[type] declarations, ignored by `flatorize`
            // but useful later in asm.js, C or D contexts
            'a:[' + a_n + ' double],b:[' + b_n + ' double],c:[' + c_n + ' double]->c:[' + c_n + ' double]'
            
            , function ( a, b, c ) {
                return zz_fm2d_flatmatmul_inplace_of_abc_ijk( a, b, c, I, J, K );
            }
            
        )

        // no flatorize wrapper, to get the fastest performance
        ,  f = wrapper.getDirect()
        ;
        
        // ...but still give access to the wrapper, in case someone
        // wants to build on top of it using a `flatorize(...)` call.
        f.wrapper = wrapper;

        fm2d_flatmatmul_inplace_of_ijk[ key ] = f;
    }
    return fm2d_flatmatmul_inplace_of_ijk[ key ];
}

// ---------- Lower-level implementation, normally not needed

function zz_fm2d_flatmatmul_inplace_of_abc_ijk( a, b, c, /*integer*/I, /*integer*/J, /*integer*/K )
// `a`, `b` and `c` can be any expressions, typically simple
// characters (e.g. a==="a", b==="b", c==="c") meaning: array named
// "a", array named "b", array named "c".
{
    return flatorize.inplace_array_output(
        zz_fm2d_flatmatmul_of_ab_ijk( a, b, I, J, K )
        , c
    );
}

function zz_fm2d_flatmatmul_of_ab_ijk( a, b, /*integer*/I, /*integer*/J, /*integer*/K )
// `a` and `b` can be any expressions, typically simple characters
// (e.g. a==="a", b==="b"), meaning: array named "a", array named "b".
{
    // Create 2-D matrices of symbolic expressions (NOT numbers)
    var ma = flatorize.matrix_of_array( a, [ I, J ] )
    ,   mb = flatorize.matrix_of_array( b, [ J, K ] )

    // Multiply in 2-D space
    ,   mc = zz_fm2d_matmul( ma, mb )
    ;
    // Come back to 1-D space
    return flatorize.array_of_matrix( mc, [ I, K ] );
}

function zz_fm2d_matmul( ma, mb )
// `ma` and `mb` are 2D matrices - i.e. array of array of expressions.
//
// See also: `flatorize.matrix()` in ../flatorize.js
{
    var mbT = flatorize.transpose( mb );
    
    return ma.map( function ( row_a ) { 
        return mbT.map( function ( col_b ) {
            // dot product of row_a and col_b
            return flatorize.sum( 
                flatorize
                    .zip( row_a, col_b )
                    .map( function ( va_vb ) { 
                        return flatorize.expr( va_vb[ 0 ], '*', va_vb[ 1 ] ); 
                    } )
            );
        } );
    } );
}

// ---------- In case someone wants to directly work in 2D (slower)

function zz_fm2d_matmul_of_ab_ijk( a, b, I, J, K ) 
{
    // Create matrices of symbolic expressions (NOT numbers)
    var ma = flatorize.matrix( a, [ I, J ] )
    ,   mb = flatorize.matrix( b, [ J, K ] )
    ;
    // Multiply the symbolic matrices
    return zz_fm2d_matmul( ma, mb );
}
