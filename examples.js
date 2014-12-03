/*
  Tests for "./flatorize.js"
  
  
  Copyright 2013 Guillaume Lathoud
  
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
  can be found in the file ./LICENSE.TXT
*/

// -*- coding:utf-8 -*-

/*global load time timeEnd log flatorize FZ
  cadd csub cmul cplx creal cimag cpol f f2 f2direct mat_a mat_b mat_c matmul342 matmulrows_zip matmul_exprgenF cst16 sin16 sin16real  sin16cut cstreal16 sinreal16 sinreal16real sinreal16cut dftreal16flat dft16flat dft64flat dft128flat dft256flat dft512flat dft1024flat dftreal1024flat dft16_cooley_tukey rand16 randreal16 cutzero dft_exprgenF dft16_baseline dft_cooley_tukey_gen

  generate_small_functions generate_big_functions generate_dftreal1024flat speed_tests
*/

if (typeof flatorize === 'undefined'  &&  typeof load === 'function')
    load( 'flatorize.js' );  // For non-browser environments (e.g. V8)

if (typeof log === 'undefined'  &&  typeof load === 'function')
    load( 'log.js' );  // For non-browser environments (e.g. V8)

var FZ = flatorize;

function generate_small_functions()
{
    if (generate_small_functions.done)
        return;
    generate_small_functions.done = true;

    cadd  = FZ('a,b',   function (a,b)   { return cplx( FZ.expr( creal(a), '+', creal(b) ), FZ.expr( cimag(a), '+', cimag(b) ) ); } );
    csub  = FZ('a,b',   function (a,b)   { return cplx( FZ.expr( creal(a), '-', creal(b) ), FZ.expr( cimag(a), '-', cimag(b) ) ); } );
    cmul  = FZ('a,b',   function (a,b)   { 
        return cplx( 
            FZ.expr( creal(a), '*', creal(b), '-', cimag(a), '*', cimag(b) ), 
            FZ.expr( creal(a), '*', cimag(b), '+', cimag(a), '*', creal(b) )
        );
    });
    creal = FZ('a',     function (a)     { return FZ.part( a, 0 ); });
    cimag = FZ('a',     function (a)     { return FZ.part( a, 1 ); });
    cplx  = FZ('re,im', function (re,im) { return [ re, im ]; });
    cpol  = FZ('r,ang', function (r,ang) { 
        return [ FZ.expr( r, '*', 'Math.cos(' + ang + ')' ), FZ.expr( r, '*', 'Math.sin(' + ang + ')' ) ] ; 
    });
    conj  = FZ('a',     function (a)     { return cplx( creal( a ), FZ.expr( '-', cimag( a ) ) ); } );

    var a = cplx(1,2)
    ,   b = cplx(10,100)
    ,   c = cadd(a,b)
    ;
    f = function (a,b,c) { return csub( csub(a,cadd(b,c)), cadd(b,c) ); };
    var   d = f(a, b, c);

    f2 = FZ('a:[2 float],b:[2 float],c:[2 float]->d:[2 float]',f);
    var   d2 = f2(a,b,c);

    f2direct = f2.getDirect();
    var d2direct = f2direct(a,b,c);

    log('d ' + d);
    log('d2 ' + d2);
    log('d2direct ' + d2direct);
    log('f2direct ' + f2direct)

    var mat_a = [ 1,  2,  3, 4, 
                  5,  6,  7, 8,
                  9, 10, 11, 12
                ];
    var mat_b = [ 13, 14,
                  15, 16,
                  17, 18,
                  19, 20
                ];
    
    // We know we will not use `matmul342` to build further expressions,
    // so we use the faster `FZ.now` instead of `FZ`.
    matmul342 = FZ.now('a:[12 float],b:[8 float]->c:[6 float]', matmul_exprgenF(3,4,2))
    var mat_c  = matmul342( mat_a, mat_b );

    log('mat_a ' + mat_a)
    log('mat_b ' + mat_b)
    log('mat_c ' + mat_c)
    log('matmul342 ' + matmul342)
}


function matmul_exprgenF(I,J,K)
{
    var cacheI = matmul_exprgenF[ I ]  ||  (matmul_exprgenF[ I ] = {})
    ,   cacheJ = cacheI[ J ]  ||  (cacheI[ J ] = {})
    ;
    if (!(K in cacheJ))
    {
        var arr = new Array( I * K );
        for (var i = 0; i < I; i++)
        {
            for (var k = 0; k < K; k++)
            {
                var one = new Array(J);
                for (var j = 0; j < J; j++)
                {
                    var a_ind = i * J + j
                    ,   b_ind = j * K + k
                    ;
                    one[ j ] = 'FZ.part( a, ' + a_ind + ' ), "*", ' +
                        'FZ.part( b, ' + b_ind + ')';
                }
                
                arr[ i * K + k ] = 
                    'FZ.expr( ' + one.join( ', "+", ' ) + ' )';
            }
        }
        cacheJ[ K ] = 
            new Function ('a,b', 'return [ ' + arr.join(',') + ' ];');
    }
    return cacheJ[ K ];
}


function tryit_speed_matmul342( button )
{
    if ('undefined' !== typeof document)
    {
        button != null  ||  (button = document.getElementById('tryit_speed_dft1024'));
        
        if (button)
            button.setAttribute( 'disabled', 'disabled' );
    }

    generate_small_functions();

    var mat_a = [ 1,  2,  3, 4, 
                  5,  6,  7, 8,
                  9, 10, 11, 12
                ];
    
    var mat_b = [ 13, 14,
                  15, 16,
                  17, 18,
                  19, 20
                ];
    
    var mat_c_expected = [170, 180, 
                          426, 452,
                          682, 724 ];

    // Make sure both implementations work

    var mat_c = matmul342( mat_a, mat_b );
    check_array( mat_c, mat_c_expected );
    
    var mat_c = matmul_classic( mat_a, mat_b, 3, 4, 2 );
    check_array( mat_c, mat_c_expected );
    
    // Measure their respective speeds

    var N = 3e6;

    time('speed_matmul_classic');
    for (var i = N; i--;)
        var mat_c = matmul_classic( mat_a, mat_b, 3, 4, 2 );
    timeEnd('speed_matmul_classic');
    
    time('speed_matmul342');
    for (var i = N; i--;)
        var mat_c = matmul342( mat_a, mat_b );
    timeEnd('speed_matmul342');

    if ('undefined' !== typeof document)
    {
        var outnode = document.getElementById( 'tryit_speed_matmul342_output' );
        
        if (!tryit_speed_matmul342.firsttimedone)
        {
            outnode.innerHTML = '';
            tryit_speed_matmul342.firsttimedone = true;
        }
    }
    
    var t_orig = time['speed_matmul_classic'] / 1000
    ,   t_flat = time['speed_matmul342'] / 1000
    ,  sp_orig = N / t_orig
    ,  sp_flat = N / t_flat
    , speedup_percent = get_speedup_percent( sp_orig, sp_flat )
    ,  line_a  = '   Classic matrix multip.: ' + sp_orig.toPrecision( 3 ) + ' MATMUL(a,b,3,4,2) calls per second\n'
    ,  line_b  = 'Flatorized matrix multip.: ' + sp_flat.toPrecision( 3 ) + ' MATMUL342(a,b) calls per second\n'
    ,  line_c  = '-> relative speedup: ' + get_speedup_percent_str( speedup_percent ) + '\n\n'
    ;
    
    if (outnode)
        outnode.innerHTML += line_a + line_b + line_c;

    log( line_a + line_b + line_c );

    if (button)
        button.removeAttribute( 'disabled' );

    return {
        t_orig : t_orig
        , t_flat : t_flat
        , sp_orig : sp_orig
        , sp_flat : sp_flat
        , speedup_percent : speedup_percent
    };
}


function tryit_speed_matmulrows_zip( button )
{
    if ('undefined' !== typeof document)
    {
        button != null  ||  (button = document.getElementById('tryit_speed_dft1024'));
        
        if (button)
            button.setAttribute( 'disabled', 'disabled' );
    }

    var rows_a = [ [ 1,  2,  3, 4] , 
                  [ 5,  6,  7, 8] ,
                  [ 9, 10, 11, 12]
                ];
    
    var rows_b = [ [ 13, 14 ],
                  [ 15, 16 ],
                  [ 17, 18 ],
                  [ 19, 20 ]
                ];
    
    var rows_c_expected = [[ 170, 180 ], 
                          [ 426, 452 ],
                          [ 682, 724 ] ];

    // Make sure both implementations work

    var matmulrows_zip   = expl_matmulrows_zip.matmulrows_zip;
    var matmulrows_loops = expl_matmulrows_loops.matmulrows_loops;

    var rows_c = matmulrows_zip( rows_a, rows_b );
    check_rows( rows_c, rows_c_expected );

    var rows_c = matmulrows_loops( rows_a, rows_b );
    check_rows( rows_c, rows_c_expected );
    
    // Measure their respective speeds

    var N = 3e5;

    time('speed_matmulrows_zip');
    for (var i = N; i--;)
        var rows_c = matmulrows_zip( rows_a, rows_b );
    timeEnd('speed_matmulrows_zip');

    time('speed_matmulrows_loops');
    for (var i = N; i--;)
        var rows_c = matmulrows_loops( rows_a, rows_b );
    timeEnd('speed_matmulrows_loops');
    
    if ('undefined' !== typeof document)
    {
        var outnode = document.getElementById( 'tryit_speed_matmulrows_zip_output' );
        
        if (!tryit_speed_matmulrows_zip.firsttimedone)
        {
            outnode.innerHTML = '';
            tryit_speed_matmulrows_zip.firsttimedone = true;
        }
    }
    
    var t_loops = time['speed_matmulrows_loops'] / 1000
    ,   t_zip = time['speed_matmulrows_zip'] / 1000
    ,  sp_loops = N / t_loops
    ,  sp_zip = N / t_zip
    , speedup_percent = get_speedup_percent( sp_zip, sp_loops )
    ,  line_a  = 'ZIP   matrix multip.: ' + sp_zip.toPrecision( 3 ) + ' matmulrows_zip(a,b) calls per second\n\n'
    ,  line_b  = 'LOOPS matrix multip.: ' + sp_loops.toPrecision( 3 ) + ' matmulrows_loops(a,b) calls per second\n'
    ,  line_c  = '-> speedup relative to ZIP: ' + get_speedup_percent_str( speedup_percent ) + '\n\n\n'
    ;
    
    if (outnode)
        outnode.innerHTML += line_a + line_b + line_c;

    log( line_a + line_b + line_c );

    if (button)
        button.removeAttribute( 'disabled' );

    return {
        t_loops : t_loops
        , t_zip : t_zip
        , sp_loops : sp_loops
        , sp_zip : sp_zip
        , speedup_percent : speedup_percent
    };
}





function tryit_speed_matmulrows_zip_342( button )
{
    if ('undefined' !== typeof document)
    {
        button != null  ||  (button = document.getElementById('tryit_speed_dft1024'));
        
        if (button)
            button.setAttribute( 'disabled', 'disabled' );
    }

    var rows_a = [ [ 1,  2,  3, 4] , 
                  [ 5,  6,  7, 8] ,
                  [ 9, 10, 11, 12]
                ];
    
    var rows_b = [ [ 13, 14 ],
                  [ 15, 16 ],
                  [ 17, 18 ],
                  [ 19, 20 ]
                ];
    
    var rows_c_expected = [[ 170, 180 ], 
                          [ 426, 452 ],
                          [ 682, 724 ] ];

    // Make sure all implementations work

    var matmulrows_loops = expl_matmulrows_loops.matmulrows_loops;

    var rows_c = matmulrows_loops( rows_a, rows_b );
    check_rows( rows_c, rows_c_expected );

    var matmulrows_zip = expl_matmulrows_zip.matmulrows_zip;
    
    var rows_c = matmulrows_zip( rows_a, rows_b );
    check_rows( rows_c, rows_c_expected );
    
    var matmulrows_zip_342 = expl_matmulrows_zip_flatorize.matmulrows_zip_342;

    var rows_c = matmulrows_zip_342( rows_a, rows_b );
    check_rows( rows_c, rows_c_expected );
    
    // Measure their respective speeds

    var N = 3e5;

    time('speed_matmulrows_zip');
    for (var i = N; i--;)
        var rows_c = matmulrows_zip( rows_a, rows_b );
    timeEnd('speed_matmulrows_zip');

    time('speed_matmulrows_loops');
    for (var i = N; i--;)
        var rows_c = matmulrows_loops( rows_a, rows_b );
    timeEnd('speed_matmulrows_loops');
    
    time('speed_matmulrows_zip_342');
    for (var i = N; i--;)
        var rows_c = matmulrows_zip_342( rows_a, rows_b );
    timeEnd('speed_matmulrows_zip_342');

    if ('undefined' !== typeof document)
    {
        var outnode = document.getElementById( 'tryit_speed_matmulrows_zip_342_output' );
        
        if (!tryit_speed_matmulrows_zip_342.firsttimedone)
        {
            outnode.innerHTML = '';
            tryit_speed_matmulrows_zip_342.firsttimedone = true;
        }
    }
    
    var t_loops = time['speed_matmulrows_loops'] / 1000
    ,   t_zip  = time['speed_matmulrows_zip'] / 1000
    ,   t_flat = time['speed_matmulrows_zip_342'] / 1000
    ,  sp_loops = N / t_loops
    ,  sp_zip  = N / t_zip
    ,  sp_flat = N / t_flat
    , speedup_percent_loops = get_speedup_percent( sp_zip, sp_loops )
    , speedup_percent_flat = get_speedup_percent( sp_zip, sp_flat )

    ,  line_a  = 'ZIP     matrix multip.: ' + sp_zip.toPrecision( 3 ) + ' matmulrows_zip(a,b) calls per second\n\n'

    ,  line_b  = 'LOOPS   matrix multip.: ' + sp_loops.toPrecision( 3 ) + ' matmulrows_loops(a,b) calls per second\n'
    ,  line_c  = '-> speedup relative to ZIP: ' + get_speedup_percent_str( speedup_percent_loops ) + '\n\n'

    ,  line_d  = 'ZIPFLAT matrix multip.: ' + sp_flat.toPrecision( 3 ) + ' matmulrows_zip_342(a,b) calls per second\n'
    ,  line_e  = '-> speedup relative to ZIP: ' + get_speedup_percent_str( speedup_percent_flat ) + '\n\n'
    
    , text = line_a + line_b + line_c + line_d + line_e + '\n'
    ;
    
    if (outnode)
        outnode.innerHTML += text;

    log( text );

    if (button)
        button.removeAttribute( 'disabled' );

    return {
        t_loops : t_loops
        , t_zip : t_zip
        , t_flat : t_flat
        , sp_loops : sp_loops
        , sp_zip : sp_zip
        , sp_flat : sp_flat
        , speedup_percent_loops : speedup_percent_loops
        , speedup_percent_flat : speedup_percent_flat
    };
}




function get_speedup_percent( sp_orig, sp_flat )
{
    return 100 * (sp_flat/sp_orig - 1);
}

function get_speedup_percent_str( speedup_percent )
{
    return (speedup_percent > 0  ?  '+'  :  '') + speedup_percent.toFixed(0) + '%';
}

function matmul_classic( a, b, I, J, K )
{
    var c = new Array( I * K );

    for (var i = I; i--;)
    {
        var a_offset = i * J
        ,   c_offset = i * K
        ;

        for (var k = K; k--;)
        {
            var sum = 0;
            for (var j = J; j--;)
                sum += a[ a_offset + j ] * b[ j * K + k ];
            
            c[ c_offset + k ] = sum;
        }
    }
    return c;
}

function check_array( a, b )
{
    var ok = a.length === b.length 
    if (ok)
    {
        for (var i = a.length; i--;)
        {
            if (a[i] !== b[i])
            {
                ok = false;
                break;
            }
        }
    }
    
    if (!ok)
        alert( 'check_array: something went wrong.' );
}

function check_rows( a, b )
{
    var ok = a.length === b.length;
    if (ok)
    {
        for (var i = 0, n = a.length; i < n; i++)
            check_array( a[ i ], b [ i ] );
    }
    
    if (!ok)
        alert( 'check_rows: something went wrong.' );
}

function tryit_speed_dft( button, dftsize )
{
    if ('undefined' !== typeof document)
    {
        button != null  ||  (button = document.getElementById('tryit_speed_dft' + dftsize));
        
        if (button)
            button.setAttribute( 'disabled', 'disabled' );
    }

    tryit_flatorize_dft( null, dftsize );  // Make sure we have an implementation

    var x = rand1024real().slice( 0, dftsize )
    ,   N = Math.round( 1e3 * 1024 / dftsize )
    
    , implFlat = eval( 'dftreal' + dftsize + 'flat' )
    , implOrig = eval( 'dftreal' + dftsize + '_cooley_tukey' )

    , timerNameFlat = 'speed_dftreal' + dftsize + 'flat'
    , timerNameOrig = 'speed_dftreal' + dftsize + 'cotu'
    ;

    time(timerNameFlat);
    for (var i = N; i--;)
        var X = implFlat( x );
    timeEnd(timerNameFlat);
    
    time(timerNameOrig);
    for (var i = N; i--;)
        var X = implOrig( x );
    timeEnd(timerNameOrig);
    
    
    var outnode = 'undefined' !== typeof document  &&  document.getElementById( 'tryit_speed_dft' + dftsize + '_output' );
    if (outnode)
    {
        if (!tryit_speed_dft[ dftsize ])
        {
            // First time only: empty the output node
            outnode.innerHTML = '';
            tryit_speed_dft[ dftsize ] = true;
        }
    }
    
    var t_orig = time[ timerNameOrig ] / 1000
    ,   t_flat = time[ timerNameFlat ] / 1000
    ,  sp_orig = N / t_orig
    ,  sp_flat = N / t_flat
    , speedup_percent = get_speedup_percent( sp_orig, sp_flat )
    ,  line_a  = '  Original Cooley-Tukey: ' + sp_orig.toPrecision( 4 ) + ' DFT' + dftsize + ' calls per second\n'
    ,  line_b  = 'Flatorized Cooley-Tukey: ' + sp_flat.toPrecision( 4 ) + ' DFT' + dftsize + ' calls per second\n'
    ,  line_c  = '-> relative speedup: ' + get_speedup_percent_str( speedup_percent ) + '\n\n'
    ;
    
    if (outnode)
        outnode.innerHTML += line_a + line_b + line_c;

    log( line_a + line_b + line_c );

    if (button)
        button.removeAttribute( 'disabled' );

    return {
        t_orig : t_orig
        , t_flat : t_flat
        , sp_orig : sp_orig
        , sp_flat : sp_flat
        , speedup_percent : speedup_percent
    };
}

function tryit_flatorize_dft( button, dftsize )
{
    if (tryit_flatorize_dft[ dftsize ])
        return;
    tryit_flatorize_dft[ dftsize ] = true;

    if ('undefined' !== typeof document)
        button != null  ||  (button = document.getElementById('tryit_flatorize_dft' + dftsize));

    if (button)
        button.setAttribute( 'disabled', 'disabled' );

    generate_dftrealflat( dftsize );

    var code_outnode = 'undefined' !== typeof document  &&  document.getElementById('tryit_flatorize_dft' + dftsize + '_output');
    if (code_outnode)
    {
        document.getElementById('tryit_flatorize_dft' + dftsize + '_output').innerHTML = 'Code generation finished! Duration: ' + (generate_dftrealflat[ dftsize ].duration / 1000) + ' seconds, Generated code length: ' + generate_dftrealflat[ dftsize ].codelength + ' characters.<span class="print-hidden"> Code:<br></span><textarea id="dftreal' + dftsize + 'flat-code" readonly="readonly" class="print-hidden code-textarea">' + generate_dftrealflat[ dftsize ].impl + '</textarea>';

    }

    // For the speed tests we'll also need the "unflat" Cooley-Tukey
    var cotu = dft_cooley_tukey_gen( Math.round( Math.log( dftsize ) / Math.log( 2 ) ), { real : true } );
    
    (new Function( 'impl', 'dftreal' + dftsize + '_cooley_tukey = impl;' ))( cotu );
    
    // Make sure both works!
    // Pure sine wave -> pure peak.

    check_dftreal( dftsize, generate_dftrealflat[ dftsize ].impl );
    check_dftreal( dftsize, cotu );
}

function generate_dftrealflat( dftsize )
{
    if (generate_dftrealflat[ dftsize ])
        return;
    generate_dftrealflat[ dftsize ] = true;

    generate_small_functions();

    var name = 'dftreal' + dftsize + 'flat';

    log('');
    time(name);
    tmp = FZ.now('arr:[' + dftsize + ' float]->X:[' + dftsize + '[2 float]]'
                 , dft_exprgenF( Math.round( Math.log( dftsize ) / Math.log( 2 ) ), { real: true } ));
    timeEnd(name);
    
    eval( name + ' = tmp' );
    
    log(name + ' code length: ' + (''+tmp).length);

    generate_dftrealflat[ dftsize ] = {
        duration : time[ name ]
        , codelength : (''+tmp).length
        , impl : tmp
    };
}

function get_dftreal_sin_input_output_for_check( dftsize, /*?boolean?*/hermihalf )
{
    var sinreal = new Array( dftsize );
    for (var i = dftsize; i--; )
        sinreal[i] = 10 * Math.sin( i / 4 * Math.PI ); 
    
    // Two peaks, and two peaks only

    var sinfreq = new Array( dftsize );
    for (var i = dftsize; i--;)
        sinfreq[ i ] = [ 0, 0 ];

    var left  = dftsize / 8
    ,   right = dftsize - left
    , howmuch = 5 * dftsize
    ;
    sinfreq[ left ][ 1 ]  = -howmuch;
    sinfreq[ right ][ 1 ] = +howmuch;

    log('sin_input_output: freq: left,right',left,right);

    if (hermihalf)
        sinfreq = sinfreq.slice( 0, (sinfreq.length >> 1) + 1 );
    
    return { input : sinreal, expected : sinfreq };
}

function check_dftreal( dftsize, fun )
{
    var     io = get_dftreal_sin_input_output_for_check( dftsize )
    , obtained = fun( io.input )
    ;
    if (obtained.some( 
        function (x,i) {
            var expected_i = this[ i ];
            return cutzero( Math.abs( x[0] - expected_i[0] ) )  ||  cutzero( Math.abs( x[1] - expected_i[1] ) ); 
        }
        , io.expected )
       )
        alert('tryit_flatorize_dft(' + dftsize + '): Something went wrong!');
}


function tryit_all( button, opt )
{
    var except = (opt  &&  opt.except)  ||  {}
    ,   npass  = (opt  &&  opt.npass)   ||  1
    ;

    if (button)
        button.setAttribute( 'disabled', 'disabled' );

    // Determine the list of tests to do

    var arr_onepass = [
        { name: 'matmul342', speedtestfun: tryit_speed_matmul342 }
        , { name: 'matmulrows_zip', speedtestfun: tryit_speed_matmulrows_zip }
        , { name: 'dft16', speedtestfun: function () { return tryit_speed_dft( null, 16 ); } }
        , { name: 'dft32', speedtestfun: function () { return tryit_speed_dft( null, 32 ); } }
        , { name: 'dft64', speedtestfun: function () { return tryit_speed_dft( null, 64 ); } }
        , { name: 'dft128', speedtestfun: function () { return tryit_speed_dft( null, 128 ); } }
        , { name: 'dft256', speedtestfun: function () { return tryit_speed_dft( null, 256 ); } }
        , { name: 'dft512', speedtestfun: function () { return tryit_speed_dft( null, 512 ); } }
        , { name: 'dft1024', speedtestfun: function () { return tryit_speed_dft( null, 1024 ); } }
    ]
        .filter( function (x) { return !except[ x.name ]; } )
    
    , arr = []
    ;
    for (var i = npass; i--;)
        arr.push.apply( arr, arr_onepass );
    
    // Do it, with a pause between two tests
    
    tryit_all_async();

    function tryit_all_async()
    {
        if (!arr.length)
        {
            // Finished

            var nrun = tryit_all._nrun = 1 + (tryit_all._nrun|0);
            
            if ('undefined' !== typeof document)
            {
                var resrow = document.getElementById( 'all-perf-yours' );
                if (resrow)
                {
                    // Archive the current results: copy the row

                    var html = resrow
                        .innerHTML
                        .replace( /<button.*?button>/, '(' + (nrun === 1  ?  nrun + 'st'  :  nrun) + ')' )
                        .replace( /(all-perf-yours)/g, '$1-run-' + nrun )
                    , runrow = document.createElement( 'tr' )
                    ;
                    runrow.innerHTML = html;
                    resrow.parentNode.insertBefore( runrow, resrow );

                    // Empty the current results in the "run it all" row
                    resrow.innerHTML = resrow
                        .innerHTML
                        .replace( /(>)[^<]+(<\/td)/gi, '$1$2' )
                        .replace( /disabled=[^\s>]*/gi, '')
                    ;
                }
                
            }
            
            return;
        }

        // Not finished

        var one = arr.shift()
        ,  name = one.name
        , result = one.speedtestfun()
        ;

        log( 'tryit_all: name: ', name, ' result: ', JSON.stringify( result ) );
        log( '.' );
        log( '' );

        if ('undefined' !== typeof document)
            document.getElementById('all-perf-yours-' + name).innerHTML = get_speedup_percent_str( result.speedup_percent );
        
        var table = 'undefined' !== typeof document  &&  document.getElementById( 'all-perf' );
        if (table)
            table.scrollIntoView();

        if ('undefined' !== typeof setTimeout)
            setTimeout( tryit_all_async, 1000 );  // Let the browser breathe a bit, then start again
        else
            tryit_all_async();            // V8
    }
    
}

// ---------- Implementation: specific test use cases ----------

function cutzero(x)
{
    return Math.abs(x) < 1e-10  ?  0  :  x;
}

function dft_exprgenF( radix, /*?object?*/opt )
// *Express* the Discrete Fourier Transform (DFT)
// for a 2-radix (N == 1 << radix)
// using a recursive Cooley-Tukey implementation.
//
// Based on:
// <a href='http://en.wikipedia.org/wiki/Cooley%E2%80%93Tukey_FFT_algorithm#Pseudocode'>http://en.wikipedia.org/wiki/Cooley%E2%80%93Tukey_FFT_algorithm#Pseudocode</a>
//
// Options: `opt = { real : true | false (default), hermihalf : true | false (default), true only makes sense when real==true as well }`
{
    var      real = opt && opt.real
    ,   hermihalf = opt && opt.hermihalf
    ;

    return exprfun;

    function exprfun(/*string*/arrname)
    {
        return hermihalf
            ? dft_ditfft2( arrname, 0, radix, 1 ).slice( 0, 1 + (1 << (radix - 1)))
            : dft_ditfft2( arrname, 0, radix, 1 )
        ;
    }

    function dft_ditfft2( arrname, offset, radix, s )
    // Returns an array of code expressions, one for each point of the
    // DFT output (array length: 2^radix).
    {
        var ret;
        if (radix < 1)
        {
            // x: real (single number) or complex (two numbers)
            var x = FZ.part( arrname, offset );  
            ret = [ real  ?  cplx( x, 0 )  :  x  ];
        }
        else
        {
            // Recursion: two calls to dft_ditfft2
            var   N = 1 << radix
            , halfN = 1 << (radix - 1)
            ,  left = dft_ditfft2( arrname, offset,     radix-1, 2*s )
            , right = dft_ditfft2( arrname, offset + s, radix-1, 2*s )
            ;
            for (var k = 0; k < halfN; k++)
            {
                var    t = left [ k ]
                ,      u = right[ k ]
                , factor = cpol.evalnow( 1, -2 * Math.PI * k / N )
                    .map( function (x) { 
                        return Math.abs(x) < 1e-15  ?  0  :  x; 
                    })
                ;
                left[ k ]  = cadd( t, cmul( factor, u ) );
                right[ k ] = csub( t, cmul( factor, u ) );
            }
            var ret = left.concat( right );
        }
        return ret;
    }
}


function dft16_baseline(v)
{
    var ret = new Array(16)
    ,   re0  = v[0][0]
    ,   im0  = v[0][1]
    ,   pi   = Math.PI
    ;
    for (var i = 0; i < 16; i++)
    {
        var re = re0
        ,   im = im0
        ;
        for (var j = 1; j < 16; j++)
        {
            var x     = v[j]
            ,   re_j  = x[0]
            ,   im_j  = x[1]
            ,   angle = -2 * pi * i * j / 16
            ,   cos_angle = Math.cos( angle )
            ,   sin_angle = Math.sin( angle )
            ;
            re += re_j * cos_angle - im_j * sin_angle;
            im += re_j * sin_angle + im_j * cos_angle;
        }
        ret[ i ] = [ re, im ];
    }
    return ret;
}


function dftreal16_baseline(v)
{
    var ret = new Array(16)
    ,   re0  = v[0]
    ,   im0  = 0
    ,   pi   = Math.PI
    ;
    for (var i = 0; i < 16; i++)
    {
        var re = re0
        ,   im = im0
        ;
        for (var j = 1; j < 16; j++)
        {
            var 
                re_j  = v[j]
            ,   im_j  = 0
            ,   angle = -2 * pi * i * j / 16
            ,   cos_angle = Math.cos( angle )
            ,   sin_angle = Math.sin( angle )
            ;
            re += re_j * cos_angle - im_j * sin_angle;
            im += re_j * sin_angle + im_j * cos_angle;
        }
        ret[ i ] = [ re, im ];
    }
    return ret;
}


function dft_cooley_tukey_gen( radix, /*?object?*/opt )
// *Implement* the Discrete Fourier Transform (DFT)
// for a 2-radix (N == 1 << radix)
// using a recursive Cooley-Tukey implementation.
//
// Based on:
// http://en.wikipedia.org/wiki/Cooley%E2%80%93Tukey_FFT_algorithm#Pseudocode
{
    var real = opt  &&  opt.real;

    var pi          = Math.PI
    ,   cplx_direct = cplx.getDirect()
    ,   cadd_direct = cadd.getDirect()
    ,   csub_direct = csub.getDirect()
    ,   cmul_direct = cmul.getDirect()
    ;

    return function (arr) { return dft_ditfft2( arr, 0, radix, 1 ); };

    function dft_ditfft2( arr, offset, radix, s )
    {
        var ret;
        if (radix < 1)
        {
            ret = [ real  ?  [ arr[ offset ], 0 ]  :  arr[ offset ] ];
        }
        else if (radix < 2) 
        {
            // Optimization that brings a speedup of 25% on Chrome23
            // compared to without `if (radix < 2) { ... }`
            var t = real  ?  [ arr[ offset     ], 0 ]  :  arr[ offset     ]
            ,   u = real  ?  [ arr[ offset + s ], 0 ]  :  arr[ offset + s ]
            ;
            return [ cadd_direct( t, u ), csub_direct( t, u ) ];
        }
        // Yes, one could further write down manually the small radix
        // cases... but then the programmer is basically doing a
        // painstaking work similar to what the "flat" approach
        // automatically does, but with an inferior performance ; at
        // least because still having function calls (cplx_direct
        // etc.) as well as a few recursive calls (dft_ditfft2) at the
        // top.
        //
        // -> not worth investigating, considering the already much
        // much better performance obtained with the flat approach,
        // for basically no other work than writing the expression.
        else
        {
            var   N = 1 << radix
            , halfN = 1 << (radix - 1)
            ,  left = dft_ditfft2( arr, offset,     radix-1, 2*s )
            , right = dft_ditfft2( arr, offset + s, radix-1, 2*s )
            ;
            for (var k = 0; k < halfN; k++)
            {
                var    t = left [ k ]
                ,      u = right[ k ]
                ,  angle = -2 * pi * k / N
                , factor = cplx( Math.cos( angle ), Math.sin( angle ) )
                ;
                left[ k ]  = cadd_direct( t, cmul_direct( factor, u ) );
                right[ k ] = csub_direct( t, cmul_direct( factor, u ) );
            }
            var ret = left.concat( right );
        }
        return ret;
    }
}


function rand1024real()
{
    return [ 0.1282171221003854, 0.8555626892325477, 0.4868615930581733, 0.8822334446999264, 0.1642991454638509, 0.3847938531198832, 0.4752562049024062, 0.2817585792827756, 0.7606114518559085, 0.3672050576375234, 0.9347732018208755, 0.333249977215507, 0.4230856585271232, 0.2373079745840775, 0.09055989437351712, 0.6619542552902331, 0.3470694621968407, 0.2424622310271026, 0.1940432033854001, 0.3392927493027645, 0.6974759209893995, 0.3036264165998763, 0.7534275132611331, 0.4294148165546454, 0.5329251996439797, 0.2399490605510542, 0.08273212362324693, 0.8942460465396587, 0.4626262154278044, 0.03361368001750469, 0.3230306395534605, 0.7336528929622007, 0.4661477500321696, 0.9178705969234545, 0.1807446658554562, 0.04402877439916845, 0.8919418474373734, 0.5481901342996565, 0.2720932725259144, 0.1834384159806766, 0.3661756606874498, 0.648016540221951, 0.5050126274918014, 0.7110934924819013, 0.7128920537689207, 0.5942930415548116, 0.2385688045084906, 0.7156380187714598, 0.1162787407340079, 0.03206300627379303, 0.9984700695827952, 0.4226617780865432, 0.1145572112790115, 0.834422489448345, 0.4575716297840656, 0.7065979766663375, 0.2327366878709711, 0.02616905448161115, 0.8145886105829555, 0.7441519476706498, 0.1575052039611802, 0.05697503521379936, 0.1077673846890467, 0.133058873479397, 0.2570526425360934, 0.05121751320705718, 0.1044211630643769, 0.6148720413698873, 0.5637224213419069, 0.2504701271723804, 0.9424387544037758, 0.8422852190963352, 0.6014902757451331, 0.82378657531218, 0.03310229055996521, 0.6263281019438324, 0.3960666116304498, 0.7322628579961676, 0.5818181670107906, 0.2931621083854704, 0.9933014675766352, 0.1033658750834015, 0.8480345604539682, 0.1500747871266563, 0.9035411398346509, 0.9585779641261312, 0.6013694382952154, 0.8269438756232192, 0.6608683420115825, 0.5424611832071247, 0.7795917488846982, 0.7382508873008499, 0.9744943465487649, 0.2876446607616135, 0.4706844361048161, 0.4373570571770404, 0.2294617221295369, 0.9647236766165513, 0.9613559236207815, 0.716849310773489, 0.4115348824499533, 0.88560382830599, 0.85869843438447, 0.7234314424190159, 0.7457995080241843, 0.5991291188937611, 0.7977976139382582, 0.1525649848671757, 0.5977558240951867, 0.9388278404761871, 0.214021891505275, 0.8685509167316238, 0.8678414857376705, 0.6298125535643246, 0.2268076969805482, 0.04127108182540244, 0.8384086187438416, 0.9668064278038893, 0.7295555543116669, 0.6403554105157572, 0.4940912730815374, 0.888755377327197, 0.948466718401819, 0.8714590899626503, 0.8086447509417127, 0.246001114848023, 0.7662789394243946, 0.4321439860862329, 0.1054915620561839, 0.6995753673000241, 0.2239340838268312, 0.4408211919345961, 0.1025720662159608, 0.8747208006544087, 0.8003207588546557, 0.7180738390840542, 0.1980805741504195, 0.1216566998597664, 0.9833174605283906, 0.4963891932579184, 0.2927161780761915, 0.5291591451550666, 0.8134698815718597, 0.2945120228340077, 0.1568193648426208, 0.1179628528991545, 0.02798871966511267, 0.1257662602023124, 0.6820554284775324, 0.6374982112805012, 0.9125781859448396, 0.589679545063468, 0.4213538543374269, 0.85321265595554, 0.295491412710827, 0.5678165676222078, 0.9298466969615594, 0.9804347105441863, 0.3939071374510125, 0.08589437008579308, 0.7992022696535918, 0.7767510577438067, 0.7416498276973117, 0.1889624723107119, 0.05604351938673895, 0.6856311106419557, 0.2521776775274564, 0.5825470065928274, 0.2866712660843748, 0.4030251959015251, 0.3532966542420685, 0.5350879954450595, 0.409661819175585, 0.3696696447940193, 0.2297636807368823, 0.1376939950437396, 0.8592281398370057, 0.5793665254109157, 0.2635873994013282, 0.8006948806130524, 0.8547190113879912, 0.3531721137769397, 0.1933540158125488, 0.2156964551161542, 0.6363165303839426, 0.4855915130251092, 0.5033868683209212, 0.9695269908170293, 0.859960548505085, 0.8060401992567962, 0.7127705033816801, 0.4116770228940949, 0.4507017836475081, 0.1528318855031277, 0.738690548101683, 0.04236690703935946, 0.1780487930636235, 0.1779641679869233, 0.1553579434619123, 0.6634456371670848, 0.2218175567583641, 0.2267720751933581, 0.7225294411900455, 0.9443418445467815, 0.1864330457335194, 0.6329699077790678, 0.7498643028634516, 0.4361712822797262, 0.7491641616691448, 0.8147661874525362, 0.3278424139824801, 0.8499782050389774, 0.6290627172992398, 0.1964522684685373, 0.07795458226848122, 0.7293606431988677, 0.826680618659697, 0.8491480539399379, 0.4902624514940913, 0.669955265441858, 0.85201933551878, 0.3377562653109999, 0.03359845736073135, 0.7044197107080727, 0.534869546365993, 0.06540992913494607, 0.9254879675594916, 0.6919373800142933, 0.6020006749737008, 0.5719173658595851, 0.3879852242152442, 0.2281976271219969, 0.0801527520825515, 0.4724093401458081, 0.4055853529023924, 0.8545764376148826, 0.6359223608601172, 0.8224167194146221, 0.5183803584796689, 0.9879041256036456, 0.709445499603977, 0.4005843735821435, 0.9320438398324471, 0.7242331996746676, 0.3361548858293796, 0.6451064787251672, 0.6717437288344666, 0.6591439939849985, 0.7268617125718972, 0.8353566889145121, 0.9036668213241786, 0.3806674699627002, 0.8631413316058953, 0.4302627289420212, 0.09331750993322323, 0.664481901601747, 0.05490579568429958, 0.04518551165321687, 0.580659409132766, 0.1560458509187797, 0.8365434641104137, 0.3482431341252943, 0.2485037453902643, 0.6376153907967754, 0.6075081872433913, 0.10855725055821, 0.3647217777364871, 0.4953235733765773, 0.007507581792236917, 0.8694542251674474, 0.1575423001314101, 0.5264119789322875, 0.1588463067548956, 0.7680270900549925, 0.8262474236326679, 0.3396964807350898, 0.434242571053681, 0.006680101911330771, 0.9038397400351978, 0.02072844392874089, 0.09041261570325658, 0.007092299054435025, 0.9348294599883064, 0.9861707599814551, 0.9006092467165627, 0.2769934919821985, 0.2050830384825024, 0.7189434048926384, 0.1539260746668995, 0.1179274395246156, 0.1425533824887762, 0.1295283499377823, 0.2691453081802704, 0.3649935613444017, 0.7440086197240174, 0.5016754894381023, 0.335155448639777, 0.2023422502604778, 0.843600614182428, 0.6074917314535818, 0.04967372648527184, 0.2386451467530973, 0.9209482131184341, 0.868134364059018, 0.3740734278567727, 0.2200481774476755, 0.2639159436012458, 0.6127039405527763, 0.2970895988430868, 0.3000668838045107, 0.3038310008031372, 0.01182722872467816, 0.6207816665086864, 0.6073018105656818, 0.2120306529903952, 0.1586321261393919, 0.1694247867774027, 0.2770830823175356, 0.7144741714335932, 0.6889764482743407, 0.04858256249703512, 0.6524992902540808, 0.8292249437694011, 0.8053671258566126, 0.09478459985176006, 0.5291682699086939, 0.5900187337370965, 0.4559342933994853, 0.1937295089819261, 0.7159491220804868, 0.231704250077979, 0.02359936329890149, 0.8039450385748566, 0.6198952520751722, 0.163566331941091, 0.7752645378662447, 0.691424149231289, 0.8791753789552841, 0.9739510560043658, 0.55845549515337, 0.8872523703897532, 0.6303686998877251, 0.2489871241595847, 0.3592728915770784, 0.492490967127822, 0.5946127923168379, 0.1984331132984345, 0.6325898366540837, 0.09158140883540815, 0.7666837238002867, 0.1488665364314828, 0.7838245484170121, 0.899614438896893, 0.2133610016877448, 0.6596031163391607, 0.503715824095753, 0.7394274654783116, 0.103355247643414, 0.3948770706912789, 0.2393785551537983, 0.8158760610410267, 0.7893975228605388, 0.2014771048497924, 0.6483211867194416, 0.2859786307125814, 0.4737444029370753, 0.1274908730852176, 0.6296631240496358, 0.2589116979593224, 0.7255191399438319, 0.9644941084111261, 0.4350261122158249, 0.06731385009278217, 0.1408729116245961, 0.974154949410035, 0.2722882350219036, 0.744941645218016, 0.7251404549813302, 0.02531972288041922, 0.4587795517687099, 0.4388687748263793, 0.7141263134352716, 0.1020364586548319, 0.8493047052881025, 0.7846856059257595, 0.356478153360106, 0.04185489908680222, 0.5139138379681306, 0.9658846683087539, 0.7094246670186231, 0.1811042032314326, 0.7916993509478821, 0.9829261057013853, 0.1330239657802434, 0.3331022561469911, 0.7635340671171966, 0.1687203156221789, 0.0871459007411302, 0.2367916759727326, 0.9654411576010754, 0.713233686537123, 0.7721545623014779, 0.007750059759614669, 0.5829673341232038, 0.1647443354263202, 0.2050113283457872, 0.6099304058202035, 0.6947196372839979, 0.1373746083574103, 0.8382932335762329, 0.5893583879618269, 0.8387051122391009, 0.647268824305363, 0.07257179583721877, 0.3531825877600015, 0.7619863245044103, 0.09302558809842336, 0.7783103628513636, 0.7788402250524933, 0.9182923855922196, 0.3671429579831154, 0.4971384364811164, 0.07774152353658818, 0.4901678912236782, 0.9760696674949066, 0.235610827038493, 0.563411120427297, 0.6791745141753259, 0.301682798964744, 0.4834597135293559, 0.3153772961721379, 0.189358996373943, 0.3807866802660906, 0.08307180312945499, 0.3313601989668701, 0.797074963436518, 0.3988654656410878, 0.7769112729866593, 0.8739429545562011, 0.8608554003015007, 0.1910570379853641, 0.2275298260517908, 0.8767072565784383, 0.01777548867465333, 0.5124237889473728, 0.1126641145692835, 0.3155154971872549, 0.937938414044418, 0.3577644375782963, 0.5525188019019834, 0.2270203821322382, 0.4791038432643299, 0.2583570489760247, 0.1768771725737013, 0.8005334587428419, 0.04174947763112817, 0.7467858529191161, 0.5082744245184427, 0.4582228625978399, 0.2926417325616136, 0.309810651520319, 0.4082417431219587, 0.5353130572209202, 0.8224746759756066, 0.7810582762953081, 0.3259982737261964, 0.5235448001312202, 0.9890916392761486, 0.5248349439703516, 0.1685334749341311, 0.6826821913273896, 0.7802538056703151, 0.9566598853783511, 0.4221282990629265, 0.8302095463321872, 0.1866929214937869, 0.3061582959235906, 0.8048243862176439, 0.6052739236207452, 0.7152297866310708, 0.6503430271710018, 0.2810280533356256, 0.6288427414426266, 0.9852663852167378, 0.7883640609179204, 0.03918561535826097, 0.9454053642829817, 0.657343864061529, 0.2103876923067763, 0.6510292265164167, 0.5187645249679458, 0.5904781491193902, 0.9847018911996243, 0.9568322152121702, 0.3878373089614501, 0.7376906280260739, 0.4463911882867471, 0.250436223675944, 0.100042616920382, 0.9554473842512201, 0.06156868810970177, 0.9603692416199693, 0.9472031303108722, 0.4629981476903163, 0.2868240957357095, 0.9895152733568083, 0.5346826221514944, 0.8091125186237741, 0.1951876909582383, 0.3088200868708921, 0.1793323099237911, 0.4979712716054057, 0.005093700810107227, 0.9335828485178962, 0.577084879043664, 0.1482219882484379, 0.3359041616842666, 0.7904164699118464, 0.6301982336980123, 0.8083988152024273, 0.7312510952751174, 0.7237516120879093, 0.4468949030675847, 0.8314247394496883, 0.4701083935828067, 0.6410088788161235, 0.5079656126727934, 0.4501887736778167, 0.0592812812102859, 0.1166103237541676, 0.6705581772340929, 0.3787239573934096, 0.7881570060705444, 0.8288503238204374, 0.2666569522009322, 0.9983871636339806, 0.2176870380841087, 0.7442709387465906, 0.6024098326914188, 0.03311749280563107, 0.07461172148161314, 0.6224400742060225, 0.5814489800812089, 0.2833958089542455, 0.9125739706757126, 0.6642720958089857, 0.8156917438462564, 0.7715056912953598, 0.3111257759944785, 0.1184155834464055, 0.05980667812397426, 0.193150118815333, 0.9444954136584082, 0.786334784568841, 0.5681427887077555, 0.1376613161291858, 0.3566877592904182, 0.7743551638195812, 0.05320642270555813, 0.3285050999880935, 0.4863214826074927, 0.6085833800750605, 0.7418675966259254, 0.5195389804834777, 0.4996692231081936, 0.8383413995061439, 0.4955943093804535, 0.3434356089072291, 0.7229159353970529, 0.8957280622971634, 0.1013439979687153, 0.007189779567473176, 0.162151362955613, 0.7477950627957175, 0.9330615837780712, 0.1356198702013285, 0.7308876665068387, 0.1043515313656218, 0.7254317281250564, 0.03722850912695312, 0.931485563507355, 0.6421524404888094, 0.4192323035778824, 0.9299433441098618, 0.06781889979828375, 0.9257839022172377, 0.6251933141341363, 0.5184338498374726, 0.8500374815431985, 0.06635066094927793, 0.3315406375412273, 0.8062212058349114, 0.1169040808035064, 0.9551868824190082, 0.09240274660518359, 0.8058617802731817, 0.6142155449428024, 0.8827814900088722, 0.8139692672054502, 0.3945433543919067, 0.5254222692082262, 0.2154203127097806, 0.04215126457167799, 0.5936202015045747, 0.2865557425727371, 0.2365659881778322, 0.796731239335938, 0.2734360440954526, 0.8637864042711605, 0.413285169630793, 0.955149005340275, 0.4441529305236863, 0.9949323176896262, 0.3181659314755037, 0.05916288181105482, 0.7995872779825697, 0.6446881702072633, 0.5155655887006925, 0.2315700000893526, 0.593096719840727, 0.4996914346169211, 0.7955687552573291, 0.4310674773977576, 0.5337374560427803, 0.8399782865400984, 0.09211836169337133, 0.5189541305582264, 0.1048468476582943, 0.8276145116379655, 0.7922672089540626, 0.4161752216374663, 0.9284483831384129, 0.4638520317284956, 0.669223237226636, 0.8757645515007885, 0.6704600375404407, 0.1289068216560607, 0.662083177493449, 0.1456745547129158, 0.1981300113813366, 0.4109726209114409, 0.8530118300637237, 0.09724972663085667, 0.6974499925102, 0.9298331019729061, 0.02011558919212679, 0.8416425287284662, 0.2971251336720271, 0.4040139921316029, 0.3737939423731965, 0.7399680147638475, 0.114974792621043, 0.3976679751296134, 0.5725666997361235, 0.8308604897100328, 0.8269645602665759, 0.4276122551288455, 0.1924412293513363, 0.05284234868953989, 0.03854310170231316, 0.08900028877356307, 0.9267668338448417, 0.8399810659344379, 0.9860203929256243, 0.5897250064115067, 0.2439872885733896, 0.2798378079913273, 0.5383222553867765, 0.2549070018858372, 0.8014757785003142, 0.4157051596374519, 0.0574955236318954, 0.9784456701797588, 0.06873654690248747, 0.4144320110875093, 0.2768756440501244, 0.3070349502809249, 0.6990225826178507, 0.5128954742222527, 0.2664308047482024, 0.7329890999788845, 0.5484146320632566, 0.4809711813995241, 0.8370747576898827, 0.4977380023509637, 0.6703723292562459, 0.5095084470721631, 0.7486217154822066, 0.4761352217054411, 0.4308814946015581, 0.4705292335653137, 0.3747341157271868, 0.7576268263118795, 0.7910293600120818, 0.9348870993811496, 0.3939953138648124, 0.2058208387862632, 0.4017057982726106, 0.1362849362200979, 0.1850878915184405, 0.3095885165072212, 0.06695865316541776, 0.6458066935350293, 0.05948165289045119, 0.5357277570399314, 0.9081276399882856, 0.6472100780470221, 0.01082385956620773, 0.2459819271600265, 0.1827225135052835, 0.3504242412078881, 0.6066064584725276, 0.8310369216009383, 0.1155808861665311, 0.2560748947022598, 0.3966513736473194, 0.5703254839665384, 0.8811863179969468, 0.1492925560067436, 0.6284161269488017, 0.8258306953321459, 0.5953085484665707, 0.7290737945158882, 0.6173822490868911, 0.5011119564652455, 0.991164881373058, 0.3330608160941763, 0.1033325203851057, 0.6145003730062272, 0.1477827079835283, 0.3545397789035734, 0.4680434855839478, 0.1031906083264227, 0.6013890960398731, 0.4387478461974146, 0.3101604340395442, 0.185955722250505, 0.9560972645695137, 0.4444109413452821, 0.087557990927204, 0.9365839313128147, 0.8651278215442545, 0.4226941761587591, 0.5506711528550833, 0.5276334015721611, 0.327731616080085, 0.3646007012767127, 0.09095196906312923, 0.3500525732778302, 0.9478062316090613, 0.6205926043609674, 0.002960892638625245, 0.823278967291613, 0.1631393766644093, 0.645046884317544, 0.9609166651205667, 0.8857834018565871, 0.9976892873646844, 0.8985304472962133, 0.4281738410586856, 0.6723323707878535, 0.2320225226271906, 0.1623114951595824, 0.8639443461141122, 0.04840917301252283, 0.01904390159177365, 0.5273794029123656, 0.5138015105537987, 0.9256099992101487, 0.3773938199810702, 0.9779068950028715, 0.4708456278424841, 0.02458651549434436, 0.8485005432884762, 0.1742370574286331, 0.7564386212267875, 0.4900229550788469, 0.4371663139610246, 0.456472231786049, 0.6459462938023951, 0.2798373779300976, 0.8247392753030273, 0.5471098571685422, 0.8192861074425744, 0.8201290169730167, 0.8256138311671354, 0.7643582077813679, 0.7579593066513044, 0.8830413396001786, 0.362794606589982, 0.07239981817564638, 0.7378534318031295, 0.5666348068460734, 0.00684700315514124, 0.2865414257396777, 0.2703859024931897, 0.001509428454941109, 0.02534572295905662, 0.1945353415919948, 0.0891468858929008, 0.6845848000822858, 0.4438855079826505, 0.8416804524113134, 0.007823441066464643, 0.7307918397433106, 0.9570170987134674, 0.7919634181138889, 0.7567701846271813, 0.7946349089506535, 0.1274482851600182, 0.7503389780986507, 0.0677504628988425, 0.5597743407477946, 0.3227510086670171, 0.7579331518901992, 0.2902178536917759, 0.04089326796267261, 0.1872966920229103, 0.6115665811718138, 0.9548022558423427, 0.8121103428440855, 0.1587494870726062, 0.8504228755887975, 0.002694300099232594, 0.5374729890845773, 0.3437589642879037, 0.9211183924307748, 0.9489790671852385, 0.2324341421701666, 0.05453757481016101, 0.9076784676194636, 0.4151326663968375, 0.9204796225117654, 0.1122654129745219, 0.9042642719080395, 0.6247843126476472, 0.8175973400076533, 0.1456477043785833, 0.6664993626313672, 0.1525124779815779, 0.754266647338157, 0.9399986676732461, 0.9990506789500355, 0.2140971633635373, 0.09717440916893764, 0.09120335190521538, 0.9285063567153357, 0.511511922208067, 0.1066003822175254, 0.9388153181691092, 0.6377063046456483, 0.4998340165183122, 0.1149614322351712, 0.4079930255183157, 0.4893373055002182, 0.2801369385451015, 0.6268223803692817, 0.248340026144397, 0.808745343124832, 0.4110055944727063, 0.7294405691206155, 0.235917032904955, 0.8094719968966072, 0.08007503213624671, 0.2272502792843139, 0.5286411890126287, 0.9733934665048523, 0.3189625093260192, 0.6025399742691679, 0.5122929261793961, 0.8072993101013747, 0.3986285032724878, 0.1721684208236109, 0.2607713687924582, 0.1201661720231479, 0.02938533130683378, 0.02224030080300625, 0.9248878985553759, 0.8509001884157659, 0.6239356675794276, 0.2713171167383129, 0.6701293454729229, 0.1043540202778749, 0.2046132534299398, 0.2653050661859637, 0.08909602953563271, 0.4382328485697985, 0.4025011400947979, 0.7476554665245804, 0.6027933686240126, 0.3733117363923518, 0.1951494660746474, 0.5984340027204209, 0.1138386561989352, 0.161258503638568, 0.7834121020967763, 0.1207961479146802, 0.7213167199254531, 0.465435399402027, 0.3648932696294364, 0.8333354137545116, 0.83345943100704, 0.5280341002734794, 0.0457014728782859, 0.428438326710529, 0.7193401023241992, 0.962090599952139, 0.9460066206658969, 0.7266942956145742, 0.2124544241745727, 0.5009367956671023, 0.1343403452351147, 0.2972135151384771, 0.778276669544206, 0.1977562806619468, 0.2641424597256889, 0.4941588018806664, 0.1680416288361006, 0.01059176014020418, 0.991355146468843, 0.47834756212024, 0.3724499013878511, 0.3008890774731167, 0.3633984164849465, 0.3542676242002888, 0.1345940970551912, 0.2663714104776704, 0.4366361326669466, 0.4268638069729661, 0.4171719799934862, 0.9029128472718724, 0.8163022082634083, 0.8646898028493716, 0.5796850306270512, 0.7121268451472064, 0.3277334499197175, 0.3009367902848351, 0.3300408165701894, 0.7023125540523614, 0.3456415354203965, 0.5850435877491373, 0.2522795241835993, 0.1503422365222299, 0.3460628210410915, 0.662414195559318, 0.3037619109084282, 0.8821155862804922, 0.4415035542942262, 0.8726897331366803, 0.7476592507302572, 0.8971179247722766, 0.225722662201598, 0.7108000138430356, 0.1767709253870746, 0.2076144336773071, 0.3974502620669046, 0.8798209150688667, 0.3364715686720988, 0.6991908631803658, 0.1761193709308539, 0.3879414981745599, 0.3563558223264005, 0.7443426734159647, 0.8880696528910096, 0.1327943429314918, 0.4278690705920531, 0.8680776576070037, 0.4439387939663618, 0.7370861512805238, 0.05714418628383981, 0.02237586698864051, 0.7050103826954608, 0.1249579133430095, 0.4437175857256115, 0.7420149001313762, 0.5926614637023068, 0.6562197010520368, 0.1336500341876027, 0.8907065005638164, 0.9937611089991105, 0.8667752451824573, 0.6341094332812317, 0.3070366984091112, 0.6189039932720876, 0.01839925959276461, 0.3510776602307042, 0.7766412264427224, 0.3849164402701182, 0.2817019615314012, 0.7174950577455277, 0.4866089437264499, 0.1569536155995983, 0.009173815598071445, 0.7811827523176859, 0.4417646459447003, 0.1421927446776995, 0.9340752873681655, 0.5358026964211424, 0.3430969078714801, 0.07838885945640887, 0.4260114246486931, 0.4814123103284608, 0.8083318716086435, 0.999121624028075, 0.6206014798044653, 0.9781180285403663, 0.7546448394775329, 0.830800432263323, 0.09133461463160968, 0.6488339579803746, 0.05096734639491422, 0.9989075631590673, 0.7450489804795054, 0.3190939520387965, 0.4615479648352817, 0.9761461608910051, 0.6931013376520095, 0.4682862363571086, 0.3623644604142554, 0.2694629895066504, 0.7834490593410315, 0.1923218231399266, 0.7143657750976287, 0.7517437406853698 ];
}