/*
  Speed tests for ./flatmat.js

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


function speedtest_flatmat_inv( cont_domnode, gen, cfg )
{
    var func = gen( 4 )

    ,   is_hand = cfg.is_hand
    ;

    
    var m = new Float64Array([
        1, 4, 2, 17
        , 54, 23, 12, 56
        , 7, 324, 23, 56
        , 542, 3, 23, 43
    ])
    , out = new Float64Array( 16 )
    ;

    var N = 500000;

    var start_ms = Date.now();

    for (var i = N; i--;)
        func( m, out );
    
    var duration_sec = (Date.now() - start_ms) / 1000
    ,   speed = N / duration_sec
    ;

    write_to_subnodes( {
        cont_domnode
        , func
        , speed
        , N
        , duration_sec
        , is_hand
    });
}

function speedtest_flatmat_mul( cont_domnode, gen, cfg )
{
    var func = gen( 3, 4, 2 )
    
    ,   is_hand = cfg.is_hand
    ;
    
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

    var N = 50000000;

    var start_ms = Date.now();

    for (var i = N; i--;)
        func( a, b, c );
    
    var duration_sec = (Date.now() - start_ms) / 1000
    ,   speed = N / duration_sec
    ;

    write_to_subnodes( {
        cont_domnode
        , func
        , speed
        , N
        , duration_sec
        , is_hand
    });
}


function speedtest_flatmat_xvmxv( cont_domnode, gen, cfg )
{
    var is_hand = cfg.is_hand

    ,  x = new Float64Array([
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
    ,  dim = x.length
    , func = gen( dim )
    ;

    var N = 30000000;    
    
    var start_ms = Date.now();

    for (var i = N; i--;)
        func( x, V, M );
    
    var duration_sec = (Date.now() - start_ms) / 1000
    ,   speed = N / duration_sec
    ;

    write_to_subnodes( {
        cont_domnode
        , func
        , speed
        , N
        , duration_sec
        , is_hand
    });
}

function speedtest_mat2d_inv( cont_domnode, gen, cfg )
{
    var func = hand_mat2d_inv_of_ij( 4 )

    ,   is_hand = cfg.is_hand
    ;

    var m = [
        [ 1, 4, 2, 17 ]
        , [ 54, 23, 12, 56 ]
        , [ 7, 324, 23, 56 ]
        , [ 542, 3, 23, 43 ]
    ].map( x => new Float64Array( x ) )
    
    , out = [
        [ 0, 0, 0, 0 ]
        , [ 0, 0, 0, 0 ]
        , [ 0, 0, 0, 0 ]
        , [ 0, 0, 0, 0 ]
    ].map( x => new Float64Array( x ) )
    ;

    var N = 1000000;

    var start_ms = Date.now();

    for (var i = N; i--;)
        func( m, out );
    
    var duration_sec = (Date.now() - start_ms) / 1000
    ,   speed = N / duration_sec
    ;

    write_to_subnodes( {
        cont_domnode
        , func
        , speed
        , N
        , duration_sec
        , is_hand
    });
}



// --------- Baseline(s)

function hand_mat2d_inv_of_ij( I, J )
// As close as possible to the flatmat implementation, i.e. also
// directly inspired/taken from numeric.inv() in numeric.js
{
    J != null  ||  (J = I);

    var A = Array.apply( null, { length : I } )
        .map( _ => new Float64Array( J ) )
    ;

    return hand_mat2d_inv;

    function hand_mat2d_inv( M, opt_out )
    {
        var B = opt_out  ||  (
            Array.apply( null, { length : I } )
                .map( _ => new Float64Array( J ) )
        );
        
        var Ai, Aj;
        var Bi, Bj;
        var i,j,k,x;

        var abs = Math.abs;
        
        for(i=0; i<I; ++i){
            Bi = B[i];
            Ai = A[i];
            var Mi = M[i];
            
            for(j=0; j<J; ++j){
                
                //if we're on the diagonal, put a 1 (for identity)
                Bi[j] = i === j  ?  1  :  0;
                
                // Also, make the copy of the original
                Ai[j] = Mi[j];
            }
        }
        
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
                return false;
            
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
        return B;
    }
}


function hand_thru2d_fm_inv_of_ij( /*integer*/I, /*?integer?*/J )
{
    J != null  ||  (J = I);  // default: square matrix

    var IJ   = I*J
    ,   Ip1J = IJ + J

     // Ip1J: extra line for swapping
    ,    A = new Float64Array( Ip1J )
    ,    B = new Float64Array( Ip1J )

    // B will be initialized with the identity matrix
    ,    B_init = fm_id( I, J )

    ,    abs = Math.abs
    ;
    
    return fm_inv;

    function fm_inv
    ( /*Float64Array*/m, /*?Float64Array?*/opt_minv )
    // Implementation: I took numeric.inv() from numeric.js and
    // adapted it to flat matrices (Float64Array).
    {
        // The output
        var minv = opt_minv  ||  new Float64Array( IJ );

        // The intermediary values
        A.set( m );       // init: copy of the input
        B.set( B_init );  // init: identity matrix

        for(var j = 0; j < J; ++j)
        {
            var i0 = -1;
            var v0 = -1;
            for(var i = j; i !== I; ++i)
            {
                var k = abs( A[ i*J+j ] );
                if( k > v0 )
                {
                    i0 = i;
                    v0 = k;
                }
            }

            var i0_begin = i0 * J
            ,    j_begin = j * J
            ,    j_end   = j_begin + J
            ;

            if (i0_begin !== j_begin)
            {
                // In both A and B, swap lines `i0` and `j`
                
                var i0_end = i0_begin + J;

                A.copyWithin( IJ,        i0_begin, i0_end );
                A.copyWithin( i0_begin,  j_begin,  j_end );
                A.copyWithin(  j_begin,  IJ,       Ip1J );
                
                B.copyWithin( IJ,        i0_begin, i0_end );
                B.copyWithin( i0_begin,  j_begin,  j_end );
                B.copyWithin(  j_begin,  IJ,       Ip1J );
            }
            
            var x_ind = j_begin + j 
            ,   x     = A[ x_ind ]
            ;

            if (x === 0)
            {
                // Failed to inverse
                // 
                // Matrix not invertible at all and/or not invertible
                // within the Float64 numerical precision.
                minv.fill( NaN );
                return false;
            }
            
            for( var k = j, ind = x_ind;
                 k !== J;
                 ++k
               )
                A[ ind++ ] /= x  // was: Aj[k] /= x;
            ;
            
            for( var k = J, ind = j_end;
                 k--;
               )
                B[ --ind ] /= x // was: Bj[k] /= x;
            ;
            
            for(var i = I; i--; )
            {
                if (i !== j)
                {
                    var i_begin = i*J
                    ,         x = A[ i_begin + j ]
                    ;

                    // was:
                    // for(k=j+1;k!==J;++k)
                    //    Ai[k] -= Aj[k]*x;

                    for (var k = j+1
                         , i_ind = i_begin + k
                         , j_ind = j_begin + k
                         ;
                         k !== J;
                         ++k
                        )
                        A[ i_ind++ ] -= A[ j_ind++ ] * x
                    ;
                    
                    // was:
                    // for(k=J-1;k>0;--k)
                    // { Bi[k] -= Bj[k]*x; --k; Bi[k] -= Bj[k]*x; }
                    // if(k===0) Bi[0] -= Bj[0]*x;

                    for (var k = J
                         , i_ind = i_begin + J
                         , j_ind = j_begin + J
                         ;
                         k--;
                        )
                        B[ --i_ind ] -= B[ --j_ind ] * x
                    ;
                }
            }
        }
        
        minv.set( B.subarray( 0, IJ ) );
        
        return minv;
    }
}




function hand_mul_of_ijk( I, J, K )
{
    return hand_mul_of_abc;
    
    function hand_mul_of_abc( a, b, c )
    {
        var c_ind = c.length;
        for (var i = I; i--;)
        {
            for (var k = K; k--;)
            {
                var acc = 0;
                for (var j = J; j--;)
                {
                    acc += a[ i*J + j ] * b[ j*K + k ];
                }
                c[ --c_ind ] = acc;
            }
        }
        return c;
    }
}

function hand_xvmxv_of_dim( dim )
{
    var mul_left = hand_mul_of_ijk( 1, dim, dim )
    ,   tmp_xmV  = new Float64Array( dim )
    ;
    return hand_xvmxv;
    
    function hand_xvmxv( x, V, M )
    {
        for (var i = dim; i--;)
            tmp_xmV[ i ] = x[ i ] - V[ i ];

        var ret = 0;
        for (var i = dim; i--;)
        {
            var acc = 0
            ,  idim = i * dim
            ;
            for (var j = dim; j--;)
                acc += tmp_xmV[ j ] * M[ idim + j ];
            
            ret += acc * tmp_xmV[ i ];
        }

        return ret;
    }
}

// ---------- Tools

function write_to_subnodes( {
    cont_domnode
    , func
    , speed
    , N
    , duration_sec
    , is_hand
})
{
    var { result_domnode, funccode_domnode } = get_subnodes( cont_domnode );
    result_domnode.textContent += 'speed (iter/sec): ' + speed.toPrecision( 5 ) + ' (' + N + '/' + duration_sec.toPrecision( 5 ) + ')\n';
    
    funccode_domnode.textContent = '// -----\n// ' + (is_hand ? 'Handwritten' : 'Generated' ) + ' code:\n' + func;
}

function get_subnodes( cont_domnode )
{
    return { result_domnode : cont_domnode.querySelector( '.result' )
             , funccode_domnode : cont_domnode.querySelector( '.func-code' )
           };
}


// ---------- Safety

(function fm_speedtest_unittest() {

    // 2-D matrix inversion
    
    var m = [
        [ 1, 4, 2, 17 ]
        , [ 54, 23, 12, 56 ]
        , [ 7, 324, 23, 56 ]
        , [ 542, 3, 23, 43 ]
    ]
    ,   minv = [
        [ 0.02666295701993568, -0.010690122413924162, 0.0004032528845117337, 0.0028556842862368756 ]
        , [ 0.03806261011863206, -0.016499239220523557, 0.0037736340871618243, 0.001524872452360714 ]
        , [ -0.9276078787064798, 0.31489411381119636, -0.010628270423968902, -0.029524495155222024 ]
        , [ 0.1574295505834409, -0.03253536166625731, 0.00033875009498698656, 0.0029466950714567243 ]
    ]
    ,   c = [
        [ 0, 0, 0, 0 ]
        , [ 0, 0, 0, 0 ]
        , [ 0, 0, 0, 0 ]
        , [ 0, 0, 0, 0 ]
    ]
    , obtained = hand_mat2d_inv_of_ij( 4 )( m, c )
    , expected = c
    ;
    obtained === expected  ||  null.bug;
    1e-10 > c.reduce(
        (current, row, i) => Math.max(
            current
            , row.reduce(
                (current, x, j) => (
                    Math.max( current, Math.abs( x - minv[ i ][ j ] ) )
                )
                , 0
            )
        )
        , 0
    )  ||  null.bug;
    
    
    // 2-D matrix inversion implemented directly in 1-D
    
    var m = [
         1, 4, 2, 17
        , 54, 23, 12, 56
        , 7, 324, 23, 56
        , 542, 3, 23, 43
    ]
    ,   minv = [
        0.02666295701993568, -0.010690122413924162, 0.0004032528845117337, 0.0028556842862368756
        , 0.03806261011863206, -0.016499239220523557, 0.0037736340871618243, 0.001524872452360714 
        , -0.9276078787064798, 0.31489411381119636, -0.010628270423968902, -0.029524495155222024 
        , 0.1574295505834409, -0.03253536166625731, 0.00033875009498698656, 0.0029466950714567243
    ]
    ,   c =     
        new Float64Array([
            0, 0, 0, 0
            , 0, 0, 0, 0
            , 0, 0, 0, 0
            , 0, 0, 0, 0
        ])
    , obtained = hand_thru2d_fm_inv_of_ij( 4 )( m, c )
    , expected = c
    ;
    obtained === expected  ||  null.bug;
    1e-10 > c.reduce(
        (current, x, ind) => Math.max( current, Math.abs( x - minv[ ind ] ) )
        , 0
    )  ||  null.bug;
    
    
    // Matrix multiplication
    
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
    ,   c_fm = new Float64Array( 3 * 2 )
    ,   c_hand = new Float64Array( 3 * 2 )
    ;
    fm_mul_of_ijk( 3, 4, 2 )( a, b, c_fm );
    hand_mul_of_ijk( 3, 4, 2 )( a, b, c_hand );

    c_fm.join( '#' ) === c_hand.join( '#' )  ||  null.bug;

    // (x-V)^T * M * (x-T)
    
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
    ,   expected = fm_xvmxv_of_dim( 3 )( x, V, M )
    ,   obtained = hand_xvmxv_of_dim( 3 )( x, V, M )
    ;

    1e-7 > Math.abs( expected - obtained );
    
})();
