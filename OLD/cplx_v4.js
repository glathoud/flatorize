// Preliminary experiment to generate functions. 
// Use case: calculations in complex domain.
//
// Diff with ./cplx_v3.js: we introduced `expr()` to *prepare* for the
// next step (optimization using local variables, not done here yet).
// 
// So we replaced these two lines:
//
//     var cadd  = exprF('a,b',   function aa(a,b)   { return cplx( creal(a) + '+' + creal(b), cimag(a) + '+' + cimag(b) ); } )
//     ,   csub  = exprF('a,b',   function bb(a,b)   { return cplx( creal(a) + '-' + creal(b), cimag(a) + '-' + cimag(b) ); } )
//     
//
// with:
//     
//     var cadd  = exprF('a,b',   function (a,b)   { return cplx( expr( creal(a), '+', creal(b) ), expr( cimag(a), '+', cimag(b) ) ); } )
//     ,   csub  = exprF('a,b',   function (a,b)   { return cplx( expr( creal(a), '-', creal(b) ), expr( cimag(a), '-', cimag(b) ) ); } )
//     
//
// The resulting implementations `cadd.direct` and `f.direct` remain
// the same as in ./cplx_v3.js
//
// As preparation for the next step, a new test case is added:
//
//     , next = exprF('a,b,c',function (a,b,c) { return csub( csub(a,cadd(b,c)), cadd(b,c) ); })
//
// `next.direct` has duplicate calculations, which shows the need for
// local variables to store intermediate calculations:
// 
//     function anonymous(a, b, c) {
//         return [a[0] - (b[0] + c[0]) - (b[0] + c[0]), a[1] - (b[1] + c[1]) - (b[1] + c[1])];
//     }
//
// Test case:
// ./cplx_v4.html
//
// Guillaume Lathoud
// December 2012

/*global cadd cplx creal cimag exprF*/
var cadd  = exprF('a,b',   function (a,b)   { return cplx( expr( creal(a), '+', creal(b) ), expr( cimag(a), '+', cimag(b) ) ); } )
,   csub  = exprF('a,b',   function (a,b)   { return cplx( expr( creal(a), '-', creal(b) ), expr( cimag(a), '-', cimag(b) ) ); } )
,   creal = exprF('a',     function (a)     { return at( a, 0 ); })
,   cimag = exprF('a',     function (a)     { return at( a, 1 ); })
,   cplx  = exprF('re,im', function (re,im) { return [ re, im ]; })
;
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
    ret.__toCode__ = function () { return '(' + this.map( code2str ).join(' ') + ')'; };
    return ret;
}
function exprF(/*comma-separated string*/varstr, /*function*/exprgen)
{
    if (exprF.within)
        throw new Error('only one exprF at a time!');
    exprF.within = 1;
    

    var vararr = varstr.split(',').map(function(s) { return s.trim(); })
    ,   direct
    ;
    
    switcher.exprgen = exprgen; // xxx debug

    delete exprF.within;
    return switcher;

    function switcher()
    {
        if (exprF.creatingDirect)
            return exprgen.apply( null, arguments )  // To be called with variable name strings
        
        if (!direct)
        {
            if (exprF.creatingDirect)
                throw new Error('bug exprF direct!');
            exprF.creatingDirect = {};
            direct = switcher.direct = new Function (varstr, 'return ' + code2str( exprgen.apply(null,vararr) ) + ';');  // To be called with values)
            delete exprF.creatingDirect;
        }

        return direct.apply( null, arguments );
    }
}
function code2str( code )
{
    if (typeof code === 'string')
        return code;

    if (code.__isExpr__  &&  code.__isExpr__())
        return code.__toCode__();

    if (code instanceof Array)
        return '[ ' + code.map( code2str ).join(', ') + ' ]';

    if ('object' === typeof code)
    {
        var retArr = [];
        for (var k in code) if (code.hasOwnProperty(k))
            retArr.push( k + ': ' + code2str( code[k] ))
        return '{ ' + retArr.join(', ') + ' }';
    }

    return '' + code;
}

var a = cplx(1,2)
,   b = cplx(10,100)
,   c = cadd(a,b)
,   d = csub(a,cadd(b,c))
,   f = exprF('a,b,c',function (a,b,c) { return csub(a,cadd(b,c));})
,  d2 = f(a,b,c)
, next = function (a,b,c) { return csub( csub(a,cadd(b,c)), cadd(b,c) ); }
, next(a,b,c) // force the creation of `next.direct`
;
