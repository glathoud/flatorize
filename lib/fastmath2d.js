var fastmath2d;

(function fm2d_unittest() {

    if ('undefined' === typeof FR)
        setTimeout( fm2d_unittest_impl, 100 );
    else
        fm2d_unittest_impl();

    function fm2d_unittest_impl()
    {
        // Does flat matrix multiplication work?

        var flatmatmul_inplace_342 = fm2d_flatmatmul_inplace_of_ijk( 3, 4, 2 );

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

        // Does flat matrix implementation of (x - V)^T * M * (x - V) work?

        var x = new Float64Array([
            1
            , 3
            , 4
        ])
        ,   V = new Float64Array([
            7
            , 11
            , 18
        ])
        ,   M = new Float64Array([
               29,  47,   76
            , 123, 199,  322
            , 521, 843, 1364

        ])
        , flatmat_xmV_M_xmV_3 = fm2d_flatmat_xmV_M_xmV_of_dim( 3 )

        , obtained = flatmat_xmV_M_xmV_3( x, V, M )

        , xmV = [ x[ 0 ] - V[ 0 ]
                  , x[ 1 ] - V[ 1 ]
                  , x[ 2 ] - V[ 2 ]
                ]
        , xmV_M = [
            xmV[0] * M[0]   + xmV[1] * M[3] + xmV[2] * M[6]
            , xmV[0] * M[1] + xmV[1] * M[4] + xmV[2] * M[7]
            , xmV[0] * M[2] + xmV[1] * M[5] + xmV[2] * M[8]
        ]
        , expected = xmV_M[0] * xmV[0] + xmV_M[1] * xmV[1] + xmV_M[2] * xmV[2]
        ;
        1e-7 > Math.abs( expected - obtained )  ||  null.bug;

        
        fastmath2d = true;
    }
    
})();

// ---------- Top-level API

function fm2d_flatmatmul_inplace_of_ijk( /*integer*/I, /*integer*/J, /*integer*/K )
// Returns a fast `func(a,b,c)` implementation of in-place matrix
// multiplication `a*b`.
//
// "in-place" means that the output `c` must already be allocated, and
// its values will be overwritten.
{
    var a_n = I*J
    ,   b_n = J*K
    ,   c_n = I*K
    ,   key = [ I, J, K ].join( '#' )
    ;
    if (!(key in fm2d_flatmatmul_inplace_of_ijk))
    {
        var func = FR(
            
            // note the :[type] declarations, ignored by `FR`
            // but useful later in asm.js, C or D contexts
            'a:[' + a_n + ' double],b:[' + b_n + ' double],c:[' + c_n + ' double]->c:[' + c_n + ' double]'
            
            , zz_fm2d_flatmatmul_inplace_of_ijk_abc.bind( null, I, J, K )
            
        )
            .getDirect() // no FR wrapper, to get the fastest performance
        ;
        
        fm2d_flatmatmul_inplace_of_ijk[ key ] = func;
    }
    return fm2d_flatmatmul_inplace_of_ijk[ key ];
}

function fm2d_flatmat_xmV_M_xmV_of_dim( /*integer*/dim )
// Compute (x - V)^T * M * (x - V)
//
// Useful e.g. to compute the exponent of a Gaussian PDF: V would be
// the mean vector and M the inverse of the covariance matrix.
{
    if (!(dim in fm2d_flatmat_xmV_M_xmV_of_dim))
    {
        var func = FR(

            'x:['+dim+' double],V:['+dim+' double],M:['+(dim*dim)+' double]->out:double'

            , zz_fm2d_flatmat_xmV_M_xmV_of_dim_xVM.bind( null, dim )
            
        ).getDirect()
        ;

        fm2d_flatmat_xmV_M_xmV_of_dim[ dim ] = func;
    }
    return fm2d_flatmat_xmV_M_xmV_of_dim[ dim ];
}

// ---------- Lower-level implementation, normally not needed

function zz_fm2d_flatmatmul_inplace_of_ijk_abc( /*integer*/I, /*integer*/J, /*integer*/K, a, b, c )
// `a`, `b` and `c` can be any expressions, typically simple
// characters (e.g. a==="a", b==="b", c==="c") meaning: array named
// "a", array named "b", array named "c".
{
    return FR.inplace_array_output(
        zz_fm2d_flatmatmul_of_ijk_ab( I, J, K, a, b )
        , c
    );
}

function zz_fm2d_flatmatmul_of_ijk_ab( /*integer*/I, /*integer*/J, /*integer*/K, a, b )
// `a` and `b` can be any expressions, typically simple characters
// (e.g. a==="a", b==="b"), meaning: array named "a", array named "b".
{
    // Create 2-D matrices of symbolic expressions (NOT numbers)
    var ma = FR.matrix_of_array( [ I, J ], a )
    ,   mb = FR.matrix_of_array( [ J, K ], b )

    // Multiply in 2-D space
    ,   mc = zz_fm2d_matmul( ma, mb )
    ;
    // Come back to 1-D space
    return FR.array_of_matrix( [ I, K ], mc );
}

function zz_fm2d_matmul( ma, mb )
// `ma` and `mb` are 2D matrices - i.e. array of array of expressions.
//
// See also: `FR.matrix()` in ../FR.js
{
    var mbT = FR.transpose( mb );
    
    return ma.map( function ( row_a ) { 
        return mbT.map( function ( col_b ) {
            // dot product of row_a and col_b
            return FR.sum( 
                FR
                    .zip( row_a, col_b )
                    .map( function ( va_vb ) { 
                        return FR.expr( va_vb[ 0 ], '*', va_vb[ 1 ] ); 
                    } )
            );
        } );
    } );
}


function zz_fm2d_flatmat_xmV_M_xmV_of_dim_xVM( dim, x, V, M )
{
    var xmV   = FR.vecsub( FR.vec( dim, x ), FR.vec( dim, V ) )

    ,   m_xmV = FR.matrix_of_array( [ dim, 1 ], xmV )
    ,   m_M   = FR.matrix_of_array( [ dim, dim ], M )

    ,   m_ret =  zz_fm2d_matmul(
        zz_fm2d_matmul( FR.transpose( m_xmV ) , m_M )
        , m_xmV
    )
    ;
    return m_ret[ 0 ][ 0 ]
    
}

// ---------- In case someone wants to directly work in 2D (slower)

function zz_fm2d_matmul_of_ijk_ab( I, J, K, a, b ) 
{
    // Create matrices of symbolic expressions (NOT numbers)
    var ma = FR.matrix( [ I, J ], a )
    ,   mb = FR.matrix( [ J, K ], b )
    ;
    // Multiply the symbolic matrices
    return zz_fm2d_matmul( ma, mb );
}
