// Preliminary experiment to generate functions. 
// Use case: calculations in complex domain.
//
// Diff with ./cplx_v4.js: we optimize using local variables.
//
// So the previously duplicate calculations:
//
//     next.direct (in ./cplx_v4.js):
//     function anonymous(a, b, c) {
//         return [a[0] - (b[0] + c[0]) - (b[0] + c[0]), a[1] - (b[1] + c[1]) - (b[1] + c[1])];
//     }
//
// are eliminated using local variables (*) to store intermediate
// calculations:
//
//     f2.getDirect() (here):
//     
//     function anonymous(a,b,c) {
//     var
//       _b0 = (b[0])
//     , _c0 = (c[0])
//     , _b0c0 = ((b[0]) + (c[0]))
//     , _b1 = (b[1])
//     , _c1 = (c[1])
//     , _b1c1 = ((b[1]) + (c[1]))
//     ;
//     return [ (((a[0]) - _b0c0) - _b0c0), (((a[1]) - _b1c1) - _b1c1) ];
//     
//     }
//
// (*) local variables are named so as not to collide with any other
// local or argument variable name ("hygienic" implementation).
//
// Test cases:
// ./cplx_v5.html
// ./cplx_v5_d8.sh
// ./cplx_v5_rhino.sh
// 
// Some initial speed measurements are included. Compared with
// ./baseline.js we get a speedup of circa 9 times in browsers,
// 3.3 times in the V8 Engine, and a 16% slow-down in Rhino.
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
,  f2direct = f2.getDirect
,  d2direct = f2direct(a,b,c)
;

time('f')
for (var n = 1e6; n--;)
    d = f(a,b,c);
timeEnd('f')


time('f2')
for (var n = 1e6; n--;)
    d2 = f2(a,b,c);
timeEnd('f2')


time('f2.direct')
for (var n = 1e6; n--;)
    d2direct = f2direct(a,b,c);
timeEnd('f2.direct')

/*

Chrome 22:
f: 704ms 
f2: 171ms 
f2.direct: 20ms 
(/ 704 20.0) -> speedup: 35.2 times
./baseline.js: 186ms -> (/ 186 20.0) -> speedup: 9.3 times

Firefox 16: (deactivated the alert "stop this script?")
f: 6391ms
f2: 1631ms
f2.direct: 448ms
(/ 6391 448.0) -> speedup: 14.3 times
./baseline.js: 5472ms -> (/ 5472 448.0) -> speedup: 12.2 times

Chromium 20:
f: 638ms 
f2: 170ms
f2.direct: 24ms
(/ 638 24.0) -> speedup: 26.6 times
./baseline.js: 201ms -> (/ 201 24.0) -> speedup: 8.4 times

V8 version 3.7.12
./cplx_v5_d8.sh 
f 710ms
f2 192ms
f2.direct 39ms
(/ 710 39.0) -> speedup: 18.2 times
./baseline.js: 130ms -> (/ 130 39.0) -> speedup: 3.3 times

Rhino 1.7 release 3 2012 02 16
./cplx_v5_rhino.sh 
f 12593ms
f2 2846ms
f2.direct 1738ms
(/ 12593 1738.0) -> speedup 7.3 times
./baseline.js: 1460ms -> (/ 1460 1738.0) -> speedup 0.84 times (actually slows down)

*/

function at( x, where )
{
    if ('string' !== typeof x)   // Try to solve right away
        return x[ where ];

    // Else form an expression string
    return x + '[' + ( 'number' === typeof where  ?  where  :  '"' + where + '"' ) + ']';
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
    ,       cfg = isTop  ?  expr2stat( code, opt )  :  opt   //  `cfg` can be nulley
    , ret 
    ;
    
    if (typeof code === 'string')
    {
        ret = code;
    }
    else if (isExpr( code ))
    {
        ret = expr2str( code, opt );
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
function expr2stat( code, /*object*/cfg )
{
    if (cfg.isTop)
        return expr2stat( code, cfg = { count: {}, pile: [], str2inpile: {}, str2expr: {}, str2varname: {}, varname: Object.create( cfg.varname )
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

    var tmp = Object.create( duplistr2shorthand );
    cfg.varInitArr = duplicates.map( function (s) { 
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
