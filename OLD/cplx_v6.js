// Preliminary experiment to generate functions. 
// Use case: calculations in complex domain.
//
// Diff with ./cplx_v5.js: we add an example with matrix multiplication.
// 
// Guillaume Lathoud
// December 2012

/*global cadd cplx creal cimag swiF*/
var cadd  = swiF('a,b',   function (a,b)   { return cplx( expr( creal(a), '+', creal(b) ), expr( cimag(a), '+', cimag(b) ) ); } )
,   csub  = swiF('a,b',   function (a,b)   { return cplx( expr( creal(a), '-', creal(b) ), expr( cimag(a), '-', cimag(b) ) ); } )
,   creal = swiF('a',     function (a)     { return at( a, 0 ); })
,   cimag = swiF('a',     function (a)     { return at( a, 1 ); })
,   cplx  = swiF('re,im', function (re,im) { return [ re, im ]; })
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

/* 

----------

Verification with octave:

mat_a = [ 1,  2,  3, 4;
              5,  6,  7, 8;
              9, 10, 11, 12;
            ]
mat_b = [ 13, 14;
             15, 16;
             17, 18;
             19, 20;
           ]
mat_c = mat_a * mat_b
mat_c =

   170   180
   426   452
   682   724

----------

Speedup verification:

time('matmul342')
for (var n = 1e6; n--;)
    mat_c  = matmul342( mat_a, mat_b )
timeEnd('matmul342')

With Chrome 22 on Ubuntu 12:
    No optimization: When at() returns the raw code string (NOT expr):
    circa 670 ms

    With optimization (as done below): When at() returns expr():
    circa 570ms

With Firefox 17 on Ubuntu 12: No optim: ~1085ms,  With optim: ~680ms

With V8 version 3.7.12:       No optim: ~115ms,   With optim: ~95ms
*/ 

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
                    one[ j ] = 'at( a, ' + a_ind + ' ), "*", at( b, ' + b_ind + ')';
                }
                
                arr[ i * K + k ] = 'expr( ' + one.join( ', "+", ' ) + ' )';
            }
        }
        cacheJ[ K ] = new Function ('a,b', 'return [ ' + arr.join(',') + ' ];')
    }
    return cacheJ[ K ];
}

// ---------- Implementation ----------

function at( x, where )
{
    if ('string' !== typeof x)   // Try to solve right away
        return x[ where ];

    // Else form an expression string, and wrap it into `expr()` to
    // make it optimizeable (see `gathering` further below).
    return expr( x + '[' + ( 'number' === typeof where  ?  where  :  '"' + where + '"' ) + ']' );
}
function expr()
{
    var ret = Array.prototype.slice.call( arguments );
    ret.__isExpr__ = function () { return true; };
    ret.__toStr__  = function ( /*?object?*/opt ) { return '(' + this.map( function (x) { return code2str( x, opt ); } ).join(' ') + ')'; };
    return ret;
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
    
    switcher.exprgen = exprgen; // xxx debug

    switcher.getDirect = switcher_getDirect;

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
            swiF.creatingDirect = 1;
            
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
            
            delete swiF.creatingDirect;
        }
        return direct;
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

function code2str( code, /*?object?*/opt )
// Returns a string (JavaScript code)
{
    var   isTop = opt  &&  opt.isTop
    , gathering = opt  &&  opt.gathering
    ,       cfg = isTop  ?  code2stat( code, opt )  :  opt   //  `cfg` can be nulley
    , ret 
    ;
    
    if (typeof code === 'string')
    {
        ret = code;
    }
    else if (isExpr( code ))
    {
        ret = expr2str( code, cfg );
    }
    else if (code instanceof Array)
    {
        ret = '[ ' + code.map( function (x) { return code2str( x, cfg ); } ).join(', ') + ' ]';
    }
    else if ('object' === typeof code)
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
        return shorthand;
    
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

    cfg.varInitArr = duplicates.map( function (s) { 
        var tmp = Object.create( duplistr2shorthand );
        tmp[ s ] = null;
        return cfg.str2varname[ s ] + ' = ' + code2str( cfg.str2expr[ s ], { duplistr2shorthand: tmp } ); 
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
                var name = '_' + str.replace( /[^\w_]/g, '' )
                ,   i    = null
                ,   varname 
                ;
                while ((varname = name + (i != null  ?  '_' + i  :  '')) in cfg.varname)
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
