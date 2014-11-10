// Preliminary experiment to generate functions. 
// Use case: calculations in complex domain.
//
// Diff with ./cplx_v8.js: now the sub-expression usage statistics are
// gathered right away, while building the expression. So we moved
// from a two-pass approach to a single pass approach. Speed goes up!
// 
// Guillaume Lathoud
// January 2013
//
// -*- coding:utf-8 -*-

/*global cadd cplx creal cimag swiF*/
var cadd  = swiF('a,b',   function (a,b)   { return cplx( expr( creal(a), '+', creal(b) ), expr( cimag(a), '+', cimag(b) ) ); } )
,   csub  = swiF('a,b',   function (a,b)   { return cplx( expr( creal(a), '-', creal(b) ), expr( cimag(a), '-', cimag(b) ) ); } )
,   cmul  = swiF('a,b',   function (a,b)   { 
    return cplx( 
        expr( creal(a), '*', creal(b), '-', cimag(a), '*', cimag(b) ), 
        expr( creal(a), '*', cimag(b), '+', cimag(a), '*', creal(b) )
    );
})
,   creal = swiF('a',     function (a)     { return part( a, 0 ); })
,   cimag = swiF('a',     function (a)     { return part( a, 1 ); })
,   cplx  = swiF('re,im', function (re,im) { return [ re, im ]; })
,   cpol  = swiF('r,ang', function (r,ang) { return [ expr( r, '*', 'Math.cos(' + ang + ')' ), expr( r, '*', 'Math.sin(' + ang + ')' ) ] ; })
;

var a = cplx(1,2)
,   b = cplx(10,100)
,   c = cadd(a,b)
,   f = function (a,b,c) { return csub( csub(a,cadd(b,c)), cadd(b,c) ); }
,   d = f(a, b, c)
,  f2 = swiF('a,b,c',f)
,  d2 = f2(a,b,c)
,  f2direct = f2.getDirect()
,  d2direct = f2direct(a,b,c)
;
log('d ' + d);
log('d2 ' + d2);
log('d2direct ' + d2direct);
log('f2direct ' + f2direct)

var mat_a = [ 1,  2,  3, 4, 
              5,  6,  7, 8,
              9, 10, 11, 12
            ]
,  mat_b = [ 13, 14,
             15, 16,
             17, 18,
             19, 20
           ]
,  matmul342 = directF('a,b', matmul_exprgenF(3,4,2))
,  mat_c  = matmul342( mat_a, mat_b )
;

log('mat_a ' + mat_a)
log('mat_b ' + mat_b)
log('mat_c ' + mat_c)
log('matmul342 ' + matmul342)

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
                    one[ j ] = 'part( a, ' + a_ind + ' ), "*", part( b, ' + b_ind + ')';
                }
                
                arr[ i * K + k ] = 'expr( ' + one.join( ', "+", ' ) + ' )';
            }
        }
        cacheJ[ K ] = new Function ('a,b', 'return [ ' + arr.join(',') + ' ];')
    }
    return cacheJ[ K ];
}


var dft16flat = directF('arr', dft_exprgenF( 4 ));
log('dft16flat: '+dft16flat)
log('dft16flat test 0: ' + dft16flat([[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]]))

cst16 = dft16flat([[1.23,4.56],[1.23,4.56],[1.23,4.56],[1.23,4.56],[1.23,4.56],[1.23,4.56],[1.23,4.56],[1.23,4.56],[1.23,4.56],[1.23,4.56],[1.23,4.56],[1.23,4.56],[1.23,4.56],[1.23,4.56],[1.23,4.56],[1.23,4.56]])
log('dft16flat test cst16: ' + cst16)
log('dft16flat test cst16.length: ' + cst16.length)
log('dft16flat test cst16: expected: ' + [16*1.23, 16*4.56, 0, 0, 0, 0 ] + '...')

sin16real = [];
for (var i = 16; i--; )
    sin16real[i] = [ 10 * Math.sin( i / 4 * Math.PI ), 0 ]; 
sin16 = dft16flat( sin16real );
sin16cut = sin16.map(function (xy) { return xy.map( cutzero ); });
log('dft16flat test sin16real: ' + sin16real );
log('dft16flat test sin16cut:  ' + sin16cut );
log('dft16flat test expected:  [ [0,0], [0,0], [0,-80], [0,0], ... , [0,0], [0,+80], [0,0] ]' );
/* octave test
sin16real = 10 * sin( (0:15) / 4 * pi )
sin16     = fft( sin16real )

sin16 =

 Columns 1 through 5:

   -0.00000 +  0.00000i   -0.00000 +  0.00000i   -0.00000 - 80.00000i    0.00000 -  0.00000i    0.00000 +  0.00000i

 Columns 6 through 10:

   -0.00000 -  0.00000i    0.00000 -  0.00000i    0.00000 -  0.00000i    0.00000 +  0.00000i    0.00000 +  0.00000i

 Columns 11 through 15:

    0.00000 +  0.00000i   -0.00000 +  0.00000i    0.00000 -  0.00000i    0.00000 +  0.00000i   -0.00000 + 80.00000i

 Column 16:

   -0.00000 -  0.00000i
*/


// --- dftreal

// Now let's redo the tests with a DFT implementation that only takes
// real signals as input (not complex).


var dftreal16flat = directF('arr', dft_exprgenF( 4, { real: true } ));
log('dftreal16flat: '+dftreal16flat)
log('dftreal16flat test 0: ' + dftreal16flat([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]))

cstreal16 = dftreal16flat([1.23,1.23,1.23,1.23,1.23,1.23,1.23,1.23,1.23,1.23,1.23,1.23,1.23,1.23,1.23,1.23])
log('dftreal16flat test cstreal16: ' + cstreal16)
log('dftreal16flat test cstreal16.length: ' + cstreal16.length)
log('dftreal16flat test cstreal16: expected: ' + [16*1.23, 0, 0, 0, 0 ] + '...')

sinreal16real = [];
for (var i = 16; i--; )
    sinreal16real[i] = 10 * Math.sin( i / 4 * Math.PI );
sinreal16 = dftreal16flat( sinreal16real );
sinreal16cut = sinreal16.map(function (xy) { return xy.map( cutzero ); });
log('dftreal16flat test sinreal16real: ' + sinreal16real );
log('dftreal16flat test sinreal16cut:  ' + sinreal16cut );
log('dftreal16flat test expected:      [ [0,0], [0,0], [0,-80], [0,0], ... , [0,0], [0,+80], [0,0] ]' );

// --- speed tests: (1) how fast can we generate code?

// circa 18ms   in V8 3.7.12 on Ubuntu 12.04
// circa 35ms   in Chrome 24 on Ubuntu 12.04
// circa 51ms   in Firefox 19 on Ubuntu 12.04
// (V8) dft64flat code length: 28023
log('');
time('dft64flat');
var dft64flat = directF('arr', dft_exprgenF( 6 ));
timeEnd('dft64flat');
log('dft64flat code length: ' + (''+dft64flat).length);

// circa  45ms in V8 3.7.12 on Ubuntu 12.04
// circa  48ms in Chrome 24 on Ubuntu 12.04
// circa 116ms in Firefox 19 on Ubuntu 12.04
// (V8) dft128flat code length: 71527
log('');
time('dft128flat');
var dft128flat = directF('arr', dft_exprgenF( 7 ));
timeEnd('dft128flat');
log('dft128flat code length: ' + (''+dft128flat).length);    

// circa 104ms  in V8 3.7.12  on Ubuntu 12.04
// circa 128ms  in Chrome 24  on Ubuntu 12.04
// circa 240ms  in Firefox 19 on Ubuntu 12.04
// (V8) dft256flat code length: 174073
log('');
time('dft256flat');
var dft256flat = directF('arr', dft_exprgenF( 8 ));
timeEnd('dft256flat');
log('dft256flat code length: ' + (''+dft256flat).length);


// circa 255ms in V8 3.7.12  on Ubuntu 12.04
// circa 302ms in Chrome 24  on Ubuntu 12.04
// circa 530ms in Firefox 19 on Ubuntu 12.04
// (V8) dft512flat code length: 406351
log('');
time('dft512flat');
var dft512flat = directF('arr', dft_exprgenF( 9 ));
timeEnd('dft512flat');
log('dft512flat code length: ' + (''+dft512flat).length);

// circa  520ms in V8 3.7.12  on Ubuntu 12.04
// circa  735ms in Chrome 24  on Ubuntu 12.04
// circa 1155ms in Firefox 19 on Ubuntu 12.04
// (V8) dft1024flat code length: 925365
log('');
time('dft1024flat');
var dft1024flat = directF('arr', dft_exprgenF( 10 ));
timeEnd('dft1024flat');
log('dft1024flat code length: ' + (''+dft1024flat).length);

// circa  533ms in V8 3.7.12  on Ubuntu 12.04
// circa  667ms in Chrome 24  on Ubuntu 12.04
// circa 1070ms in Firefox 19 on Ubuntu 12.04
// (V8) dftreal1024flat code length: 854770
log('');
time('dftreal1024flat');
var dftreal1024flat = directF('arr', dft_exprgenF( 10, { real: true } ));
timeEnd('dftreal1024flat');
log('dftreal1024flat code length: ' + (''+dftreal1024flat).length);

// --- speed tests: (2) how fast does the generated code run (on some
//     fixed random data) ?

rand16 = [ 
    [ 2.15074, 4.98519 ], [ 7.28642, 4.98956 ], [ 0.38129, 6.68055 ], 
    [ 1.57163, 5.23702 ], [ 1.69916, 4.87542 ], [ 6.51501, 2.18907 ], 
    [ 5.71654, 4.22741 ], [ 5.35605, 9.69844 ], [ 9.76599, 4.33753 ], 
    [ 6.51291, 2.13312 ], [ 5.66562, 3.29095 ], [ 6.78840, 7.36267 ], 
    [ 3.42213, 5.06189 ], [ 2.71545, 4.66241 ], [ 5.06886, 2.61295 ], 
    [ 2.78884, 9.15349 ]
];

randreal16 = [ 
    2.15074, 7.28642, 0.38129, 1.57163, 1.69916, 6.51501, 
    5.71654, 5.35605, 9.76599, 6.51291, 5.66562, 6.78840, 
    3.42213, 2.71545, 5.06886, 2.78884
];

// First, sanity checks

var randreal16dftreal16flat = dftreal16flat(randreal16);
sanity_check_randreal16dftreal16_against_octave( randreal16dftreal16flat );

var rand16dft16flat = dft16flat(rand16);
sanity_check_rand16dft16_against_octave( rand16dft16flat );

var rand16dft16_baseline = dft16_baseline(rand16);
sanity_check_rand16dft16_against_octave( rand16dft16_baseline );

var rand16dft16_cooley_tukey = dft16_baseline(rand16);
sanity_check_rand16dft16_against_octave( rand16dft16_cooley_tukey );

// Second, run the speed tests

// circa 1.0  second  with V8 3.7.12  on Ubuntu 12.04
// circa 1.0  second  with Chrome 24  on Ubuntu 12.04
// circa 4.9  seconds with Firefox 19 on Ubuntu 12.04
log('');
time('randreal16dftreal16flat ');
for (var i = 2e6; i--;)
    var randreal16dftreal16flat = dftreal16flat(randreal16);
timeEnd('randreal16dftreal16flat ');

// circa 1.1 second  with V8 3.7.12  on Ubuntu 12.04
// circa 1.1 second  with Chrome 24  on Ubuntu 12.04
// circa 6.5 seconds with Firefox 19 on Ubuntu 12.04
log('');
time('rand16dft16flat         ');
for (var i = 2e6; i--;)
    var rand16dft16flat = dft16flat(rand16);
timeEnd('rand16dft16flat         ');

log('')
log('Watch out! dft16flat is tested with 10 times *more* iterations than dft16_baseline and dft16_cooley_tukey')
log('')

// Note: baseline tested on 10 times less iterations than for rand16dft16flat
// circa  1.5 second  with V8 3.7.12  on Ubuntu 12.04
// circa  1.3 second  with Chrome 24  on Ubuntu 12.04
// circa 21   seconds with Firefox 19 on Ubuntu 12.04
time('rand16dft16_baseline    ');
for (var i = 2e5; i--;)       // <<< 10 times less iterations than for rand16dft16flat
    rand16dft16_baseline = dft16_baseline(rand16);
timeEnd('rand16dft16_baseline    ');


// Note: cooley_tukey tested on 10 times less iterations than for rand16dft16flat
// circa  1.4 second  with V8 3.7.12  on Ubuntu 12.04
// circa  1.1 second  with Chrome 24  on Ubuntu 12.04
// circa  7.6 seconds with Firefox 19 on Ubuntu 12.04
dft16_cooley_tukey = dft_cooley_tukey_gen( 4 );
time('rand16dft16_cooley_tukey');
for (var i = 2e5; i--;)       // <<< 10 times less iterations than for rand16dft16flat
    rand16dft16_cooley_tukey = dft16_cooley_tukey(rand16);
timeEnd('rand16dft16_cooley_tukey');

// ---- Sanity checks against octave

function sanity_check_randreal16dftreal16_against_octave( randreal16dftreal16 )
/* octave:

randreal16 = [ 2.15074, 7.28642, 0.38129, 1.57163, 1.69916, 6.51501, 5.71654, 5.35605, 9.76599, 6.51291, 5.66562, 6.78840, 3.42213, 2.71545, 5.06886, 2.78884
];
randreal16dft16 = fft( randreal16 )

randreal16dft16 =

 Columns 1 through 5:

   73.40504 +  0.00000i  -16.91738 +  5.03247i    9.87399 +  1.35568i    4.22290 -  2.07313i    0.20571 -  6.52487i

 Columns 6 through 10:

  -11.06427 -  5.18440i    3.71689 -  8.12130i   -6.70225 -  4.97068i   -5.66438 +  0.00000i   -6.70225 +  4.97068i

 Columns 11 through 15:

    3.71689 +  8.12130i  -11.06427 +  5.18440i    0.20571 +  6.52487i    4.22290 +  2.07313i    9.87399 -  1.35568i

 Column 16:

  -16.91738 -  5.03247i

*/
{
    if (randreal16dftreal16.length !== 16)
        throw new Error('randreal16dftreal16.length must be 16! Got instead: ' + randreal16dftreal16.length);

    var octave_truth = [
        [   73.40504, +  0.00000 ], [  -16.91738, +  5.03247 ], [    9.87399, +  1.35568 ], [    4.22290, -  2.07313 ], [    0.20571, -  6.52487 ], 
        [  -11.06427, -  5.18440 ], [    3.71689, -  8.12130 ], [   -6.70225, -  4.97068 ], [   -5.66438, +  0.00000 ], [   -6.70225, +  4.97068 ], 
        [    3.71689, +  8.12130 ], [  -11.06427, +  5.18440 ], [    0.20571, +  6.52487 ], [    4.22290, +  2.07313 ], [    9.87399, -  1.35568 ], 
        [  -16.91738, -  5.03247 ]
    ];

    for (var i = 16; i--;)
    {
        var Xi       = randreal16dftreal16[ i ]
        ,   Xi_truth = octave_truth[ i ]
        ,   dreal    = Math.abs( Xi[ 0 ] - Xi_truth[ 0 ] )
        ,   dimag    = Math.abs( Xi[ 1 ] - Xi_truth[ 1 ] )
        ;
        if (dreal > 1e-5  ||  dimag > 1e-5)   throw new Error('Buggy!');
    }
}


function sanity_check_rand16dft16_against_octave( rand16dft16 )
/* octave:

rand16 = [ 2.15074 + i * 4.98519, 7.28642 + i * 4.98956, 0.38129 + i * 6.68055, 1.57163 + i * 5.23702, 1.69916 + i * 4.87542, 6.51501 + i * 2.18907, 5.71654 + i * 4.22741, 5.35605 + i * 9.69844, 9.76599 + i * 4.33753, 6.51291 + i * 2.13312, 5.66562 + i * 3.29095, 6.78840 + i * 7.36267, 3.42213 + i * 5.06189, 2.71545 + i * 4.66241, 5.06886 + i * 2.61295, 2.78884 + i * 9.15349 ];
rand16dft16 = fft( rand16 )

rand16dft16 =

 Columns 1 through 5:

   73.40504 + 81.49767i  -16.51270 +  9.20394i    8.77590 +  5.35386i   12.85020 -  2.11734i  -17.27175 -  4.07670i

 Columns 6 through 10:

   -9.88671 -  6.35530i   -3.64349 - 13.34865i  -13.00144 -  5.33640i   -5.66438 -  9.35389i   -0.40306 +  4.60496i

 Columns 11 through 15:

   11.07726 +  2.89394i  -12.24183 +  4.01350i   17.68317 +  8.97304i   -4.40441 +  2.02892i   10.97209 +  2.64249i

 Column 16:

  -17.32205 -  0.86100i
*/
{
    if (rand16dft16.length !== 16)
        throw new Error('rand16dft16.length must be 16! Got instead: ' + rand16dft16.length);

    var octave_truth = [
        [   73.40504, + 81.49767 ], [  -16.51270, +  9.20394 ], [    8.77590, +  5.35386 ], [   12.85020, -  2.11734 ], [  -17.27175, -  4.07670 ], 
        [   -9.88671, -  6.35530 ], [   -3.64349, - 13.34865 ], [  -13.00144, -  5.33640 ], [   -5.66438, -  9.35389 ], [   -0.40306, +  4.60496 ], 
        [   11.07726, +  2.89394 ], [  -12.24183, +  4.01350 ], [   17.68317, +  8.97304 ], [   -4.40441, +  2.02892 ], [   10.97209, +  2.64249 ], 
        [  -17.32205, -  0.86100 ]
    ];

    for (var i = 16; i--;)
    {
        var Xi       = rand16dft16[ i ]
        ,   Xi_truth = octave_truth[ i ]
        ,   dreal    = Math.abs( Xi[ 0 ] - Xi_truth[ 0 ] )
        ,   dimag    = Math.abs( Xi[ 1 ] - Xi_truth[ 1 ] )
        ;
        if (dreal > 1e-5  ||  dimag > 1e-5)   throw new Error('Buggy!');
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
// http://en.wikipedia.org/wiki/Cooley%E2%80%93Tukey_FFT_algorithm#Pseudocode
{
    var real = opt && opt.real;

    return function (arrname) { return dft_ditfft2( arrname, 0, radix, 1 ); };

    function dft_ditfft2( arrname, offset, radix, s )
    {
        var ret;
        if (radix < 1)
        {
            var x = part( arrname, offset );  // x: real (single number) or complex (two numbers)
            ret = [ real  ?  cplx( x, 0 )  :  x  ];
        }
        else
        {
            var   N = 1 << radix
            , halfN = 1 << (radix - 1)
            ,  left = dft_ditfft2( arrname, offset,     radix-1, 2*s )
            , right = dft_ditfft2( arrname, offset + s, radix-1, 2*s )
            ;
            for (var k = 0; k < halfN; k++)
            {
                var    t = left [ k ]
                ,      u = right[ k ]
                , factor = cpol.directeval( 1, -2 * Math.PI * k / N ).map( function (x) { return Math.abs(x) < 1e-15  ?  0  :  x; })
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


function dft_cooley_tukey_gen( radix )
// *Implement* the Discrete Fourier Transform (DFT)
// for a 2-radix (N == 1 << radix)
// using a recursive Cooley-Tukey implementation.
//
// Based on:
// http://en.wikipedia.org/wiki/Cooley%E2%80%93Tukey_FFT_algorithm#Pseudocode
{
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
            ret = [ arr[ offset ] ];
        }
        else if (radix < 2) // Optimization that brings a speedup of 25% on Chrome23 compared to without  `if (radix < 2) { ... }`
        {
            var t = arr[ offset     ]
            ,   u = arr[ offset + s ]
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


// ---------- Implementation: generic flat implementation of mathematic expressions ----------

function part( x, where )
{
    if ('string' !== typeof x  &&  !isExpr( x ))   // Try to solve right away
        return x[ where ];

    // Else form an expression string, and wrap it into `expr()` to
    // make it optimizeable (see `gathering` further below).
    return expr( x + '[' + ( 'number' === typeof where  ?  where  :  '"' + where + '"' ) + ']' );
}
function expr()
{
    var ret = expr_simplify( Array.prototype.slice.call( arguments ) );

    if (ret.length === 1  &&  isExpr(ret[0]))
        return ret[0];

    // Try to find an already existing expression that matches.
    var exprCache = swiF.exprCache
    ,  idstr2expr = exprCache.idstr2expr
    , idnum2count = exprCache.idnum2count
    ,       idstr = getExprIdstr( ret )
    ;
    if (idstr in idstr2expr)
    {
        ret = idstr2expr[ idstr ];

        // Update the stats
        
        var idnum = ret.__exprIdnum__; 
        idnum2count[ idnum ] = 1 + (idnum in idnum2count  ?  idnum2count[ idnum ]  :  1); // Start counting at 2, i.e. only the duplicates.
    }
    else
    {
        // Not found. Create a new expression object `ret`
        
        ret.__isExpr__ = function () { return true; };
        ret.__toStr__  = function ( /*?object?*/opt, /*?object?*/topopt ) 
        { 
            // var ret = this.map( function (x) { return code2str( x, opt ); } ).join(' ');
            // For performance reasons, implemented using a for loop.
            
            var n = this.length
            , ret = new Array( n )
            ;
            for (var i = 0; i < n; i++)
                ret[ i ] = code2str( this[ i ], opt );
            ret = ret.join(' ');

            if (topopt  &&  topopt.no_paren)
                return ret;
            
            return /^\(.*\)$/.test( ret )  ?  ret  :  '(' + ret + ')';
        };
        
        // Update the cache

        var idnum = ret.__exprIdnum__ = exprCache.idnum_next++;

        idstr2expr[ idstr ]  = exprCache.idnum2expr[ idnum ] = ret;

        // Update the stats for the children

        for (var n = ret.length, i = 0; i < n; i++)
        {
            var x = ret[ i ];
            if (!isExpr(x))
                continue;

            var x_idnum = x.__exprIdnum__;
            idnum2count[ x_idnum ] = 1 + (x_idnum in idnum2count  ?  idnum2count[ x_idnum ]  :  1); // Start counting at 2, i.e. only the duplicates.
        }
    }    

    // Et voilà

    return ret;
}
function expr_simplify( arr )
{
    if (arr.length < 3)
        return arr;

    for (var i = 2; i--;)
    {
    
        arr = expr_simplify_multiplications( arr );
        arr = expr_simplify_additions( arr );
        arr = expr_simplify_substractions( arr );

    }

    return arr;
}
function getExprIdstr( x )
{
    if (x instanceof Array)
    {
        var n = x.length
        , tmp = new Array(n)
        ;
        for (var i = n; i--;)
        {
            var x_i = x[ i ];
            if (isExpr(x_i))
            {
                tmp[ i ] = '#' + x_i.__exprIdnum__;
            }
            else 
            {
                var tox_i = typeof x_i;
                if (tox_i === 'string')
                    tmp[ i ] = x_i;
                else if (tox_i === 'number'  ||  tox_i === 'boolean')
                    tmp[ i ] = '' + x_i;
                else
                    throw new Error('getExprIdstr: probably a bug !');
            }
        }
        return tmp.join(' ');
    }
    
    return '' + x;
}
function directF(varstr, exprgen)
// Convenience shortcut
{
    return swiF( varstr, exprgen ).getDirect();
}

function swiF(/*comma-separated string*/varstr, /*function*/exprgen)
{
    if (swiF.within)
        throw new Error('only one swiF at a time!');
    swiF.within = 1;
    

    var vararr = varstr.split(',').map(function(s) { return s.trim(); })
    ,   direct
    ;
    
    switcher.exprgen = exprgen; // to debug

    switcher.getDirect = switcher_getDirect;
    switcher.directeval  = switcher_directeval;

    delete swiF.within;
    return switcher;

    function switcher()
    {
        if (swiF.creatingDirect)
        {
            var e = exprgen.apply( null, arguments )  // To be called with variable name strings
            if ('string' === typeof e)
                e = expr(e);
            
            return e;
        }
        
        if (!direct)
            switcher_getDirect();
        
        return direct.apply( null, arguments );
    }

    function switcher_getDirect()
    {
        if (!direct)
        {
            swiF.creatingDirect = 1 + ~~swiF.creatingDirect;
            
            swiF.exprCache = { idstr2expr:   {}
                               , idnum2expr: {}
                               , idnum_next: 0
                               , idnum2count:  {}
                             };
            (swiF.pile_exprCache || (swiF.pile_exprCache = [])).push( swiF.exprCache );
            
            check_exprgen_if_possible( exprgen );

            var e = exprgen.apply(null,vararr);
            
            // To prevent name collision when creating local variable names
            var varnameset = {};
            for (var i = vararr.length; i--;)
                varnameset[ vararr[i] ] = 1
            ;
            
            var code = '/* ' + exprgen + ' */\n' + 
                code2str( e, { isTop: true, varnameset: varnameset } )
            ;
            direct = new Function (varstr, code);  // To be called with values
            
            swiF.creatingDirect--;
            swiF.exprCache = swiF.pile_exprCache.pop();
        }
        return direct;
    }

    function switcher_directeval()
    {
        return this.getDirect().apply( null, arguments );
    }
}

function check_exprgen_if_possible( exprgen )
// Try to ensure that `exprgen` is a pure expression
// (provided that function decompilation works)
{
    var probably_decompiled = '' + exprgen
    ,   mo = probably_decompiled.match( /^\s*function\s+(\w+)?\s*\([^\)]*\)\s*\{\s*([^\s;\[]+)/ )
    ;
    if (mo)
    {
        if (mo[2] !== 'return')
            throw new Error('`exprgen` must implement a pure expression, that is only one `return` statement (necessary condition).');
    }
}

function code2str( code, /*?object?*/opt, /*?object?*/topopt )
// Returns a string (JavaScript code), after two depth-first walks:
// one walk to gather stats (how often is used a given expression),
// one walk to generate the code including temporary variable names.
{
    var   isTop = opt  &&  opt.isTop
    ,       cfg = isTop  ?  code2stat( code, opt )  :  opt   //  `cfg` can be nulley
    , typeof_code = typeof code
    , is_string
    , is_number
    , is_expr
    , is_array
    , is_object = ('object' === typeof code)
    , topopt_do_not_cache = topopt  &&  topopt.do_not_cache
    , topopt_no_paren     = topopt  &&  topopt.no_paren
    , ret 
    ;

    // Faster code string generation through caching.
    // Useful for deeply recursive cases like DFT128.

    if (is_object  &&  !topopt_do_not_cache)
    {
        var CODE2STR_CFG_ID = code2str._CFG_ID  ||  (code2str._CFG_ID = '__code2str_cfg_id')
        ,   CODE2STR_CACHE  = '__code2str_cache' + (
            !cfg  
                ? '_RAW'
                : '_cfg' + (CODE2STR_CFG_ID in cfg  // an integer id of the `cfg` object
                   ?  cfg[ CODE2STR_CFG_ID ]
                   :  (cfg[ CODE2STR_CFG_ID ] = (code2str[ CODE2STR_CFG_ID ] = 1 + ~~code2str[ CODE2STR_CFG_ID ]))))
        ;
    }

    if (CODE2STR_CACHE  &&  (CODE2STR_CACHE in code))
        return code[ CODE2STR_CACHE ];
    
    if (is_string = (typeof_code === 'string'))
    {
        ret = code;
    }
    else if (is_number = (typeof_code === 'number'))
    {
        ret = '' + code;
    }
    else if (is_expr = isExpr( code ))
    {
        ret = expr2str( code, cfg, topopt );
    }
    else if (is_array = code instanceof Array)
    {
        // ret = '[ ' + code.map( function (x) { return code2str( x, cfg ); } ).join(', ') + ' ]';
        // for performance reasons, implemented using a for loop
        var n = code.length
        , tmp = new Array( n )
        ;
        for (var i = 0; i < n; i++)
            tmp[ i ] = code2str( code[ i ], cfg, /*topopt:*/{ no_paren: true } );
        
        ret = '[ ' + tmp.join(', ') + ' ]';
    }
    else if (is_object)
    {
        var retArr = [];
        for (var k in code) if (code.hasOwnProperty(k))
            retArr.push( k + ': ' + code2str( code[k], cfg, /*topopt:*/{ no_paren: true } ) )
        ret = '{ ' + retArr.join(', ') + ' }';
    }
    else
    {
        throw new Error('code2str detected a bug');
    }

    var shorthandvarname;
    if (isTop)
    {
        var varInitArr = cfg.varInitArr;
        
        ret = (varInitArr.length  ?  'var\n  ' + varInitArr.join('\n, ') + '\n;'  :  '')
            + '\nreturn ' + ret + ';\n'
        ;
    }
    else if (shorthandvarname = cfg  &&  'object' === typeof code  &&  ('__exprIdnum__' in code)  &&  cfg.dupliidnum2varname[ code.__exprIdnum__ ])
        ret = shorthandvarname;
    
    if (CODE2STR_CACHE)
        code[ CODE2STR_CACHE ] = ret;
    
    return ret;
}
function isExpr( code )
{
    return code.__isExpr__  &&  code.__isExpr__();
}
function expr2str( expr, opt, topopt )
{
    return expr.__toStr__( opt, topopt );
}
function code2stat( code, /*object*/cfg )
{
    if (cfg.isTop)
        return code2stat( code, cfg = { dupliidnum2varname: {}
                                        , varnameset: Object.create( cfg.varnameset )
                                      } );

    // Input: statistics gathered while creating expressions
    // (implicitely depth-first walk).

    var   exprCache = swiF.exprCache
    ,   idnum2count = exprCache.idnum2count
    ,   idnum2expr  = exprCache.idnum2expr
    
    // Output: find and setup temporary variable names
    // for duplicates = expressions used more than one time.
    
    ,   duplicates = []  // list of `idnum` (integers)
    ,   dupliidnum2varname = cfg.dupliidnum2varname  // mapping (mapping idnum   -> varname)
    ,   varnameset         = cfg.varnameset          // set     (mapping varname -> 1)
    ;
    
    // List the duplicates in their depth-first order of first use.
    
    for (var n = exprCache.idnum_next, i = 0; i < n; i++)
        if (idnum2count[ i ] > 1)
            duplicates.push( i );
    
    for (var shift = 0, n = duplicates.length, 
         i = 0; i < n; i++)
    {
        var idnum = duplicates[ i ]
        ,   varname
        ;
        
        // Prevent collision between/among local varnames and function varnames
        
        while ((varname = '_' + (i + shift).toString(36))  in  varnameset)
            shift++;

        varnameset[ varname ]  = 1;
        dupliidnum2varname[ idnum ] = varname;
    }

    var CODE2STR_CFG_ID = code2str._CFG_ID
    ,   cfgid = cfg[ CODE2STR_CFG_ID ]  ||  (cfg[ CODE2STR_CFG_ID ] = 'STAT')  // see caching above (for faster code string generation)
    ;
    
    cfg.varInitArr = duplicates.map( function (idnum) { 
        
        var tmp = Object.create( dupliidnum2varname );
        tmp[ idnum ] = null;
        
        var tmpcfg = { dupliidnum2varname: tmp };
        tmpcfg[ CODE2STR_CFG_ID ] = cfgid;
        
        var initcode = code2str( idnum2expr[ idnum ], tmpcfg, /*topopt:*/ { do_not_cache: true, no_paren: true } );

        // Remove superfluous top-level spaces parentheses from the
        // initialization code.
        initcode = initcode;

        return cfg.dupliidnum2varname[ idnum ] + ' = ' + initcode;
    } );
    
    return cfg;
}

// ---------- expression simplification details ----------

function expr_simplify_multiplications( arr )
{
    arr = [].concat( arr );  // shallow copy
    for (var i = arr.length - 1; 0 < i--;)
    {
        if (arr[i] !== '*')
            continue;

        var next = arr[ i+1 ];
        if (next === 1  ||  next === '1')
        {
            arr.splice( i, 2 );
            continue;
        }
        if (next === 0  ||  next === '0')
        {
            arr.splice( i-1, 3, 0 );
            continue;
        }
        

        if (i > 0)
        {
            var previous = arr[ i-1 ];
            if (previous === 1  ||  previous === '1' )
            {
                arr.splice( i-1, 2 );
                continue;
            }
            if (previous === 0  ||  previous === '0')
            {
                arr.splice( i-1, 3, 0 );
                continue;
            }
            if (previous === -1  ||  previous === '-1')
            {
                arr.splice( i-1, 2, '-' );
                continue;
            }
        }
    }
    return arr;
}

function expr_simplify_additions( arr ) 
{
    arr = [].concat( arr );  // shallow copy
    for (var i = arr.length - 1; 0 < i--;)
    {
        if (arr[i] !== '+')
            continue;

        var next = arr[ i+1 ];
        if (next === 0  ||  next === '0')
        {
            arr.splice( i, 2 );
            continue;
        }

        if (i > 0)
        {
            var previous = arr[ i-1 ];
            if (previous === 0  ||  previous === '0')
            {
                arr.splice( i-1, 2 );
                continue;
            }
        }
    }
    return arr;
}
    
function expr_simplify_substractions( arr )
{
    arr = [].concat( arr );  // shallow copy
    for (var i = arr.length - 1; 0 < i--;)
    {
        if (arr[i] !== '-')
            continue;

        var next = arr[ i+1 ];
        if (next === 0  ||  next === '0')
        {
            arr.splice( i, 2 );
            continue;
        }
        if (next === '-')
        {
            arr.splice( i, 2, '+' );
            continue;
        }
        
        if (i > 0)
        {
            var previous = arr[ i-1 ];
            if (previous === 0  ||  previous === '0')
            {
                if ('number' === typeof next)
                {
                    arr.splice( i-1, 3, -next );
                    continue;
                }
            }
        }

        if ('number' === typeof next)
        {
            arr.splice( i, 2, '+', -next );
            continue;
        }
        
    }
    
    return arr;
}
    


// ---------- log details ----------

function log(/*...arguments...*/)
{
    // Browser environment
    if (typeof console !== 'undefined'  &&  console.log)
    {
	try
	{
	    console.log.apply( console, arguments );
	}
	catch (e) 
	{
	    // Probably some IE browser
	    console.log( Array.prototype.join.call( arguments, ' ' ) )
	}
    }
    
    else
    {
        // Non-browser environment
        print.apply( null, arguments );
    }
}

function time(name)
{
    // Browser environment
    if (typeof console !== 'undefined'  &&  console.log)
    {
        console.time(name);
    }
    else
    {
        time[name] = new Date;  // Using the fact that JavaScript functions are objects as well.
    }
}

function timeEnd(name)
{
    // Browser environment
    if (typeof console !== 'undefined'  &&  console.log)
    {
        console.timeEnd(name);
    }
    else
    {
        time[name] = new Date - time[name];
        log(name, time[name] + 'ms');
    }
}
