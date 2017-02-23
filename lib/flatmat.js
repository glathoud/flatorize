/* Fast math functions for 2-D matrices stored as flat (1-D) arrays of
   numbers.

   Requires: ../flatorize.js


  Copyright 2017 Guillaume Lathoud
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
  http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  
  A copy of the Apache License Version 2.0 as of February 20th, 2013
  can be found in the file ../LICENSE.TXT
*/

/*global FR flatmat Float64Array JSON setTimeout

fm_unittest

fm_id
fm_inv_of_ij
fm_mul_of_ijk
fm_mu_sigma_of_dim
fm_xvmxv_of_dim

zz_fm_mul_of_ijk_abc
zz_fm_mul_of_ijk_ab
zz_fm_matmul
zz_fm_mu_sigma_of_dim
zz_fm_xvmxv_of_dim_xvm
zz_fm_matmul_of_ijk_ab

*/

var flatmat;

(function fm_unittest() {

    if ('undefined' === typeof FR)
        setTimeout( fm_unittest_impl, 100 );
    else
        fm_unittest_impl();

    function fm_unittest_impl()
    {
        // -- Does flat matrix multiplication work?

        var flatmatmul_342 = fm_mul_of_ijk( 3, 4, 2 );

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
        flatmatmul_342( a, b, c );

        JSON.stringify( Array.apply( null, c ) ) === JSON.stringify([
            1*13+2*15+3*17+4*19, 1*14+2*16+3*18+4*20
            , 5*13+6*15+7*17+8*19, 5*14+6*16+7*18+8*20
            , 9*13+10*15+11*17+12*19, 9*14+10*16+11*18+12*20
        ])
            ||  null.bug
        ;

        // -- Does flat matrix implementation of (x - v)^T * m * (x - v) work?

        var x = new Float64Array([
            1
            , 3
            , 4
        ])
        ,   v = new Float64Array([
            7
            , 11
            , 18
        ])
        ,   m = new Float64Array([
               29,  47,   76
            , 123, 199,  322
            , 521, 843, 1364

        ])
        , flatmat_xvmxv_3 = fm_xvmxv_of_dim( 3 )

        , obtained = flatmat_xvmxv_3( x, v, m )

        , xv = [ x[ 0 ] - v[ 0 ]
                  , x[ 1 ] - v[ 1 ]
                  , x[ 2 ] - v[ 2 ]
                ]
        , xv_m = [
            xv[0] * m[0]   + xv[1] * m[3] + xv[2] * m[6]
            , xv[0] * m[1] + xv[1] * m[4] + xv[2] * m[7]
            , xv[0] * m[2] + xv[1] * m[5] + xv[2] * m[8]
        ]
        , expected = xv_m[0] * xv[0] + xv_m[1] * xv[1] + xv_m[2] * xv[2]
        ;
        1e-7 > Math.abs( expected - obtained )  ||  null.bug;

        // -- Does matrix inversion work?

        var fm_inv_4 = fm_inv_of_ij( 4 )
        ,   fm_mul_4 = fm_mul_of_ijk( 4 )
        ;
        
        var m = new Float64Array([
            1, 4, 2, 17
            , 54, 23, 12, 56
            , 7, 324, 23, 56
            , 542, 3, 23, 43
        ])
        ,   minv = new Float64Array([
            0.02666295701993568, -0.010690122413924162, 0.0004032528845117337, 0.0028556842862368756
            , 0.03806261011863206, -0.016499239220523557, 0.0037736340871618243, 0.001524872452360714
            , -0.9276078787064798, 0.31489411381119636, -0.010628270423968902, -0.029524495155222024
            , 0.1574295505834409, -0.03253536166625731, 0.00033875009498698656, 0.0029466950714567243
        ])

        ,   Id  = fm_id( 4 )
        
        ,   tmp = new Float64Array( 16 )
        ,   epsilon = 1e-10
        ;

        // First, check minv itself

        fm_mul_4( m, minv, tmp );
        is_finite( tmp )  ||  null.bug;
        epsilon > compare( tmp, Id )  ||  null.bug;
        
        // Second, check the implementation

        var obtained = fm_inv_4( m, tmp );
        obtained === tmp  ||  null.bug;
        is_finite( tmp )  ||  null.bug;
        epsilon > compare( tmp, minv )   ||  null.bug;

        // --- Does matrix inversion fail where it should?

        var m = new Float64Array([
            1,   3,   4,     7
            ,  11,  18,  29,    47
            ,  76, 123, 199,   322
            , 521, 843, 1364, 2207
        ])
        ,      tmp = new Float64Array( 16 ) // filled with zeroes
        , obtained = fm_inv_4( m, tmp )
        ;
        obtained === false  ||  null.bug;
        !is_finite( tmp )  ||  null.bug; // filled with NaNs
        
        // -- Done!
        
        flatmat = true;

        // -- Details

        function compare( a, b )
        {
            is_finite( a )  ||  null.bug;
            is_finite( b )  ||  null.bug;
            
            return a.reduce( compare_one_pair, 0 );

            function compare_one_pair(current, va, ind)
            {
                var vb = b[ ind ];
                return Math.max(
                    current
                    , Math.abs( va - vb )
                );
            }
        }

        function is_finite( arr )
        {
            return arr.every( function ( v ) {
                return 'number' === typeof v  &&  isFinite( v );
            } );
        }
    

    }
    
})();

// ---------- Top-level API

function fm_id( /*integer*/I, /*integer*/J )
{
    J != null  ||  (J = I);  // default: square matrix

    var m = new Float64Array( I*J );
    
    for (var i = 0, i_end = Math.min( I, J ), ind = 0, Jp1 = J + 1;
         i < i_end;
         ++i, ind += Jp1
        )
        m[ ind ] = 1
    ;

    return m;
}

function fm_inv_of_ij( /*integer*/I, /*?integer?*/J )
{
    J != null  ||  (J = I);  // default: square matrix

    var IJ   = I*J

    ,    A_flat = new Float64Array( IJ )

    // B will be initialized with the identity matrix
    ,    B_flat      = fm_id( I, J )
    ,    B_flat_init = fm_id( I, J )

    // For matrix inversion it is faster to work in 2-D the whole
    // time, probably because of faster row swaps.

    ,    A = Array.apply( null, { length : I } )
        .map( function (_,i) {
            return A_flat.subarray( i*J, (i+1)*J );
        })
    
    ,    B = Array.apply( null, { length : I } )
        .map( function (_,i) {
            return B_flat.subarray( i*J, (i+1)*J );
        })

    // remember the initial order of rows
    ,    A_init = A
    ,    B_init = B
    
    ,    abs = Math.abs
    ;
    
    return hand_thru2d_fm_inv;
    
    function hand_thru2d_fm_inv
    ( /*Float64Array*/m_flat, /*?Float64Array?*/opt_out )
    // Implementation: I took numeric.inv() from numeric.js and
    // adapted it to flat matrices (Float64Array).
    {
        // The output
        var out = opt_out  ||  new Float64Array( IJ );
        
        // The intermediary values
        A_flat.set( m_flat );       // init: copy of the input
        B_flat.set( B_flat_init );  // init: identity matrix

        // remember the initial order of rows
        A = A_init;
        B = B_init; 

        for(j=0;j<J;++j) {
            var i0 = -1;
            var v0 = -1;
            for(i=j;i!==I;++i) { k = abs(A[i][j]); if(k>v0) { i0 = i; v0 = k; } }

            if (i0 === j)
            {
                Aj = A[j];
                Bj = B[j];
            }
            else
            {
                Aj = A[i0]; A[i0] = A[j]; A[j] = Aj;
                Bj = B[i0]; B[i0] = B[j]; B[j] = Bj;
            }
            
            x = Aj[j];
            if (x === 0)
            {
                // Failed to inverse
                // 
                // Matrix not invertible at all and/or not invertible
                // within the Float64 numerical precision.
                out.fill( NaN );
                return false;
            }
             
            for(k=j;k!==J;++k)    Aj[k] /= x; 
            for(k=J-1;k!==-1;--k) Bj[k] /= x;
            for(i=I-1;i!==-1;--i) {
                if(i!==j) {
                    Ai = A[i];
                    Bi = B[i];
                    x = Ai[j];
                    for(k=j+1;k!==J;++k)  Ai[k] -= Aj[k]*x;
                    for(k=J-1;k>0;--k) { Bi[k] -= Bj[k]*x; --k; Bi[k] -= Bj[k]*x; }
                    if(k===0) Bi[0] -= Bj[0]*x;
                }
            }
        }

        // Copy the resulting values: *not* from B_flat, but rather
        // row-by-row because B's rows have been swapped

        for (var i = 0, ind = 0;
             i<I;
             ++i,
             ind += J
            )
            out.set( B[ i ], ind )
        ;
        
        return out;
    }
}

function fm_mul_of_ijk( /*integer*/I, /*?integer?*/J, /*?integer?*/K )
// Returns a fast `func(a,b,c)` implementation of in-place matrix
// multiplication `a*b`.
//
// "in-place" means that the output `c` must already be allocated, and
// its values will be overwritten.
{
    J != null  ||  (J = I);  // default
    K != null  ||  (K = J);  // default
    
    var a_n = I*J
    ,   b_n = J*K
    ,   c_n = I*K
    ,   key = [ I, J, K ].join( '#' )
    ;
    if (!(key in fm_mul_of_ijk))
    {
        var func = FR(
            
            // note the :[type] declarations, ignored by `FR`
            // but useful later in asm.js, C or D contexts
            'a:[' + a_n + ' double],b:[' + b_n + ' double],c:[' + c_n + ' double]->c:[' + c_n + ' double]'
            
            , zz_fm_mul_of_ijk_abc.bind( null, I, J, K )
            
        )
            .getDirect() // no FR wrapper, to get the fastest performance
        ;
        
        fm_mul_of_ijk[ key ] = func;
    }
    return fm_mul_of_ijk[ key ];
}


function fm_mu_sigma_of_dim( /*integer*/dim )
// Returns a function `f` that computes the mean vector and covariance
// (flat)matrix of an array of vectors `v_arr`.
//
// The returned function `f` itself takes as input `v_arr`, and
// optionally pre-allocated output arrays: `maybe_mu` & `maybe_sigma`,
// both (Float64)Arrays of numbers.  Returned value : `{mu,sigma}`
{
    if (!(dim in fm_mu_sigma_of_dim))
        fm_mu_sigma_of_dim[ dim ] = zz_fm_mu_sigma_of_dim( dim );

    return fm_mu_sigma_of_dim[ dim ];
}

function fm_xvmxv_of_dim( /*integer*/dim )
// Compute (x - v)^T * m * (x - v)
//
// Useful e.g. to compute the exponent of a Gaussian PDF: v would be
// the mean vector and m the inverse of the covariance matrix.
{
    if (!(dim in fm_xvmxv_of_dim))
    {
        var func = FR(

            'x:['+dim+' double],v:['+dim+' double],m:['+(dim*dim)+' double]->out:double'

            , zz_fm_xvmxv_of_dim_xvm.bind( null, dim )
            
        ).getDirect()
        ;

        fm_xvmxv_of_dim[ dim ] = func;
    }
    return fm_xvmxv_of_dim[ dim ];
}

// ---------- Lower-level implementation, normally not needed

function zz_fm_mul_of_ijk_abc( /*integer*/I, /*integer*/J, /*integer*/K, a, b, c )
// `a`, `b` and `c` can be any expressions, typically simple
// characters (e.g. a==="a", b==="b", c==="c") meaning: array named
// "a", array named "b", array named "c".
{
    return FR.inplace_array_output(
        zz_fm_mul_of_ijk_ab( I, J, K, a, b )
        , c
    );
}

function zz_fm_mul_of_ijk_ab( /*integer*/I, /*integer*/J, /*integer*/K, a, b )
// `a` and `b` can be any expressions, typically simple characters
// (e.g. a==="a", b==="b"), meaning: array named "a", array named "b".
{
    // Create 2-D matrices of symbolic expressions (NOT numbers)
    var ma = FR.matrix_of_array( [ I, J ], a )
    ,   mb = FR.matrix_of_array( [ J, K ], b )

    // Multiply in 2-D space
    ,   mc = zz_fm_matmul( ma, mb )
    ;
    // Come back to 1-D space
    return FR.array_of_matrix( [ I, K ], mc );
}

function zz_fm_matmul( ma, mb )
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


function zz_fm_mu_sigma_of_dim( dim )
// Create a function that computes the mean vector and covariance
// (flat)matrix of an array of vectors `v_arr`.
//
// The returned function itself takes as input `v_arr`, and optionally
// two pre-allocated output arrays: `maybe_mu` and `maybe_sigma`, both
// (Float64)Arrays of numbers.  Returned value : `{mu,sigma}`
{
    var arr_dim = FR.empty_array( dim ).map( function (_,i) { return i; } );    
    
    var param = 'v_arr,maybe_mu,maybe_sigma'
    ,    code = [

         'var n     = v_arr.length'
        , 'var mu    = maybe_mu  ||  new Float64Array(' + dim + ')'
        , 'var sigma = maybe_sigma  ||  new Float64Array(' + (dim*dim) + ')'
        , 'var ' + arr_dim.map( function (i) {
            return [ 'v' + i
                     , 'mu' + i + ' = 0'
                   ]
                .concat( arr_dim.slice( i ).map( function (j) {
                    return 'sigma' + i + '_' + j + ' = 0';
                }))
                .join( ', ' )
            ;
        } ).join( ', ' )

        , 'for (var k = n; k--;) {'
        , '  var v = v_arr[ k ]'
    ]
        .concat(
            arr_dim.map( function (i) {
                return 'mu' + i + ' += (v' + i +' = v[' + i + ']); sigma' + i + '_' + i + ' += v'+i+' * v'+i;
            })
        )
        .concat(
            arr_dim.map( function (i) {
                return arr_dim.slice( i+1 ).map( function (j) {
                    return 'sigma' + i + '_' + j + ' += v'+i+' * v'+j;
                });
            })
                .reduce( function (a,b) { return a.concat( b ); } )
        )
        .concat([
            '}'
        ])
        .concat(
            arr_dim.map( function (i) {
                return 'mu['+i+'] = (mu' + i + '/= n)';
            })
        )
        .concat(
            arr_dim.map( function (i) {
                return arr_dim.slice( i ).map( function (j) {
                    return (i < j  ?  'sigma[' + (j*dim+i)+ '] = '  :  '') +
                        'sigma[' + (i*dim+j) +'] = ' +
                        'sigma' + i + '_' + j + '/n - mu' + i + ' * mu' + j
                    ;
                })
            })
                .reduce( function (a,b) { return a.concat( b ); } )
        )
        .concat([
            'return { mu : mu, sigma : sigma }'
        ])
        .join( ';\n' )
    ;

    return new Function( param, code );
}


function zz_fm_xvmxv_of_dim_xvm( dim, x, v, m )
{
    var xv   = FR.vecsub( FR.vec( dim, x ), FR.vec( dim, v ) )

    ,   xv_M = FR.matrix_of_array( [ dim, 1 ], xv )
    ,   m_M  = FR.matrix_of_array( [ dim, dim ], m )

    ,   M_ret =  zz_fm_matmul(
        zz_fm_matmul( FR.transpose( xv_M ) , m_M )
        , xv_M
    )
    ;
    return M_ret[ 0 ][ 0 ];
}

// ---------- In case someone wants to directly work in 2D (slower)

function zz_fm_matmul_of_ijk_ab( I, J, K, a, b ) 
{
    // Create matrices of symbolic expressions (NOT numbers)
    var ma = FR.matrix( [ I, J ], a )
    ,   mb = FR.matrix( [ J, K ], b )
    ;
    // Multiply the symbolic matrices
    return zz_fm_matmul( ma, mb );
}
