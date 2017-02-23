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


function speedtest_flatmatmul( cont_domnode, gen, cfg )
{
    var result_domnode  = cont_domnode.querySelector( '.result' )
    ,   funccode_domnode = cont_domnode.querySelector( '.func-code' )

    ,   func = gen( 3, 4, 2 )
    
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

    result_domnode.textContent += 'speed (iter/sec): ' + speed.toPrecision( 5 ) + ' (' + N + '/' + duration_sec.toPrecision( 5 ) + ')\n';

    funccode_domnode.textContent = '// -----\n// ' + (is_hand ? 'Handwritten' : 'Generated' ) + ' code:\n' + func;
}


function speedtest_flatmat_xvmxv( cont_domnode, gen, cfg )
{
    var result_domnode   = cont_domnode.querySelector( '.result' )
    ,   funccode_domnode = cont_domnode.querySelector( '.func-code' )

    ,   is_hand = cfg.is_hand

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

    result_domnode.textContent += 'speed (iter/sec): ' + speed.toPrecision( 5 ) + ' (' + N + '/' + duration_sec.toPrecision( 5 ) + ')\n';

    funccode_domnode.textContent = '// -----\n// ' + (is_hand ? 'Handwritten' : 'Generated' ) + ' code:\n' + func;
}

// --------- Baseline(s)

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

// ---------- Safety

(function fm_speedtest_unittest() {

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
