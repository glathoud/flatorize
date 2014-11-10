// Preliminary experiment to generate functions. 
// Use case: calculations in complex domain.
//
// Diff with ./cplx_v6.js: we add DFT examples (Cooley-Tukey).
// 
// Guillaume Lathoud
// December 2012

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

// circa 0.24 second in V8 3.7.12 on Ubuntu 12.04
// circa 0.25 second in Chrome 23 on Ubuntu 12.04
// circa 0.37 second in Firefox 17 on Ubuntu 12.04
time('dft64flat');
var dft64flat = directF('arr', dft_exprgenF( 6 ));
timeEnd('dft64flat');


// circa  1.5 seconds in V8 3.7.12 on Ubuntu 12.04
// circa  1.4 seconds in Chrome 23 on Ubuntu 12.04
// circa  2.1 seconds in Firefox 17 on Ubuntu 12.04
if (true) 
{
    time('dft128flat');
    var dft128flat = directF('arr', dft_exprgenF( 7 ));
    timeEnd('dft128flat');
}

// circa  8.8 seconds in V8 3.7.12  on Ubuntu 12.04
// circa  7.8 seconds in Chrome 23  on Ubuntu 12.04
// circa 13.2 seconds in Firefox 17 on Ubuntu 12.04
if (false)
{
    time('dft256flat');
    var dft256flat = directF('arr', dft_exprgenF( 8 ));
    timeEnd('dft256flat');
}

// V8: dft512flat -> Fatal error in JS # Allocation failed - process out of memory
if (false)
{
    time('dft512flat');
    var dft512flat = directF('arr', dft_exprgenF( 9 ));
    timeEnd('dft512flat');
}

// V8: dft1024flat -> Fatal error in JS # Allocation failed - process out of memory


rand16 = [ 
    [ 2.15074, 4.98519 ], [ 7.28642, 4.98956 ], [ 0.38129, 6.68055 ], [ 1.57163, 5.23702 ], [ 1.69916, 4.87542 ], [ 6.51501, 2.18907 ], 
    [ 5.71654, 4.22741 ], [ 5.35605, 9.69844 ], [ 9.76599, 4.33753 ], [ 6.51291, 2.13312 ], [ 5.66562, 3.29095 ], [ 6.78840, 7.36267 ], 
    [ 3.42213, 5.06189 ], [ 2.71545, 4.66241 ], [ 5.06886, 2.61295 ], [ 2.78884, 9.15349 ]
];

// circa 1.1 second  with V8 3.7.12  on Ubuntu 12.04
// circa 1.0 second  with Chrome 23  on Ubuntu 12.04
// circa 5.8 seconds with Firefox 17 on Ubuntu 12.04
time('rand16dft16flat');
for (var i = 2e6; i--;)
    var rand16dft16flat = dft16flat(rand16);
timeEnd('rand16dft16flat');
log('rand16dft16flat: ' + rand16dft16flat); // for the sanity check against octave (see below)

log('')
log('Watch out! dft16flat is tested with 10 times *more* iterations than dft16_baseline and dft16_cooley_tukey')
log('')

// Note: baseline tested on 10 times less iterations than for rand16dft16flat
// circa 1.5 second  with V8 3.7.12  on Ubuntu 12.04
// circa 1.3 second  with Chrome 23  on Ubuntu 12.04
// circa 22  seconds with Firefox 17 on Ubuntu 12.04
time('rand16dft16_baseline');
for (var i = 2e5; i--;)       // <<< 10 times less iterations than for rand16dft16flat
    rand16dft16_baseline = dft16_baseline(rand16);
timeEnd('rand16dft16_baseline');
log('rand16dft16_baseline: ' + rand16dft16_baseline);  // for the sanity check against octave (see below)


// Note: cooley_tukey tested on 10 times less iterations than for rand16dft16flat
// circa 1.4 second  with V8 3.7.12  on Ubuntu 12.04
// circa 1.1 second  with Chrome 23  on Ubuntu 12.04
// circa 7.3 seconds with Firefox 17 on Ubuntu 12.04
dft16_cooley_tukey = dft_cooley_tukey_gen( 4 );
time('rand16dft16_cooley_tukey');
for (var i = 2e5; i--;)       // <<< 10 times less iterations than for rand16dft16flat
    rand16dft16_cooley_tukey = dft16_cooley_tukey(rand16);
timeEnd('rand16dft16_cooley_tukey');
log('rand16dft16_cooley_tukey: ' + rand16dft16_cooley_tukey);  // for the sanity check against octave (see below)

/* Sanity check with octave

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

function cutzero(x)
{
    return Math.abs(x) < 1e-10  ?  0  :  x;
}

function dft_exprgenF( radix )
// *Express* the Discrete Fourier Transform (DFT)
// for a 2-radix (N == 1 << radix)
// using a recursive Cooley-Tukey implementation.
//
// Based on:
// http://en.wikipedia.org/wiki/Cooley%E2%80%93Tukey_FFT_algorithm#Pseudocode
{
    return function (arrname) { return dft_ditfft2( arrname, 0, radix, 1 ); };

    function dft_ditfft2( arrname, offset, radix, s )
    {
        var ret;
        if (radix < 1)
        {
            ret = [ part( arrname, offset ) ];
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


// ---------- Implementation ----------

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

    ret.__isExpr__ = function () { return true; };
    ret.__toStr__  = function ( /*?object?*/opt ) 
    { 
        // var ret = this.map( function (x) { return code2str( x, opt ); } ).join(' ');
        // For performance reasons, implemented using a for loop.
        
        var n = this.length
        , ret = new Array( n )
        ;
        for (var i = 0; i < n; i++)
            ret[ i ] = code2str( this[ i ], opt );
        ret = ret.join(' ');
        return /^\(.*\)$/.test( ret )  ?  ret  :  '(' + ret + ')';
    };
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
            
            check_exprgen_if_possible( exprgen );

            var e = exprgen.apply(null,vararr);
            
            // To prevent name collision when creating local variable names
            var varname = {};
            for (var i = vararr.length; i--;)
                varname[ vararr[i] ] = 1
            ;
            
            var code = '/* ' + exprgen + ' */\n' + 
                code2str( e, { isTop: true, varname: varname } )
            ;
            direct = new Function (varstr, code);  // To be called with values
            
            swiF.creatingDirect--;
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

function code2str( code, /*?object?*/opt, /*?boolean?*/do_not_cache )
// Returns a string (JavaScript code)
{
    var   isTop = opt  &&  opt.isTop
    , gathering = opt  &&  opt.gathering
    ,       cfg = isTop  ?  code2stat( code, opt )  :  opt   //  `cfg` can be nulley
    , typeof_code = typeof code
    , is_string
    , is_number
    , is_expr
    , is_array
    , is_object = ('object' === typeof code)
    , ret 
    ;

    // Faster code string generation through caching.
    // Useful for deeply recursive cases like DFT128.

    if (!gathering  &&  is_object  &&  !do_not_cache)
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
        ret = expr2str( code, cfg );
    }
    else if (is_array = code instanceof Array)
    {
        // ret = '[ ' + code.map( function (x) { return code2str( x, cfg ); } ).join(', ') + ' ]';
        // for performance reasons, implemented using a for loop
        var n = code.length
        , tmp = new Array( n )
        ;
        for (var i = 0; i < n; i++)
            tmp[ i ] = code2str( code[ i ], cfg );
        
        ret = '[ ' + tmp.join(', ') + ' ]';
    }
    else if (is_object)
    {
        var retArr = [];
        for (var k in code) if (code.hasOwnProperty(k))
            retArr.push( k + ': ' + code2str( code[k], cfg ) )
        ret = '{ ' + retArr.join(', ') + ' }';
    }
    else
    {
        throw new Error('code2str detected a bug');
    }

    var shorthand;
    if (isTop)
    {
        var varInitArr = cfg.varInitArr;
        
        ret = (varInitArr.length  ?  'var\n  ' + varInitArr.join('\n, ') + '\n;'  :  '')
            + '\nreturn ' + ret + ';\n'
        ;
    }
    else if (gathering)
        gathering( code, ret );
    else if (shorthand = cfg  &&  cfg.duplistr2shorthand[ code2str( code ) ])
        ret = shorthand;
    
    if (CODE2STR_CACHE)
        code[ CODE2STR_CACHE ] = ret;
    
    return ret;
}
function isExpr( code )
{
    return code.__isExpr__  &&  code.__isExpr__();
}
function expr2str( expr, opt )
{
    return expr.__toStr__( opt );
}
function code2stat( code, /*object*/cfg )
{
    if (cfg.isTop)
        return code2stat( code, cfg = { count: {}, pile: [], str2inpile: {}, str2expr: {}, str2varname: {}, varname: Object.create( cfg.varname )
                                        , gathering: stat_gathering 
                                      } );

    code2str( code, cfg ); // Calls `cfg.gathering` recursively through the code
    
    delete cfg.gathering;

    var duplicates = cfg.pile.filter( function (s) { return cfg.count[ s ] > 1; } );

    var duplistr2shorthand = cfg.duplistr2shorthand = {};
    for (var i = duplicates.length; i--;)
    {
        var str = duplicates[ i ];
        cfg.duplistr2shorthand[ str ] = cfg.str2varname[ str ];
    }

    var CODE2STR_CFG_ID = code2str._CFG_ID
    ,   cfgid = cfg[ CODE2STR_CFG_ID ]  ||  (cfg[ CODE2STR_CFG_ID ] = 'STAT')  // see caching above (for faster code string generation)
    ;
    
    cfg.varInitArr = duplicates.map( function (s) { 
        var tmp = Object.create( duplistr2shorthand );
        tmp[ s ] = null;

        var tmpcfg = { duplistr2shorthand: tmp };
        tmpcfg[ CODE2STR_CFG_ID ] = cfgid;
        
        return cfg.str2varname[ s ] + ' = ' + code2str( cfg.str2expr[ s ], tmpcfg, true ); 
    } );
    
    return cfg;

    function stat_gathering( code, str )
    {
        if (isExpr( code ))
        {
            if (!(str in cfg.count))
            {
                cfg.count[ str ] = 0;

                // Prevent collision between/among local varnames and function varnames
                var name = '_' + str.replace( /[^\w_]/g, '' ).substring( 0, 20 )
                ,   i    = null
                ,   varname 
                ;
                while ((varname = name + (i != null  ?  '_' + i.toString(36)  :  '')) in cfg.varname)
                    i++;

                cfg.varname[ varname ] = 1;
                cfg.str2varname[ str ] = varname;
            }
            
            cfg.count[ str ]++;

            if (!cfg.str2inpile[str])
            {
                cfg.pile.push( str );
                cfg.str2inpile[ str ] = 1;
            }
            cfg.str2expr[ str ] = code;
        }
    }
}

// ---------- simplification details ----------

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
