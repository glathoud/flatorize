// Preliminary experiment to generate functions. 
// Use case: calculations in complex domain.
//
// Diff with ./cplx_v0.js:
// The user does not need anymore to write `.expr` everywhere.
//
// As you can see in `f.direct` expressions are fully expanded,
// which can lead to duplicate calculations.
//
// Implementation: 
// 
// 
// Guillaume Lathoud
// December 2012
//
// cadd:
// function switcher() {
//     if (exprF.within) {
//         return exprgen.apply(null, arguments);
//     }
//     return direct.apply(null, arguments);
// }
// 
// cadd.direct:
// function anonymous(a, b) {
//     return [a[0] + b[0], a[1] + b[1]];
// }
//
// f.direct:
// function anonymous(a, b, c) {
//     return [a[0] - [b[0] + c[0], b[1] + c[1]][0], a[1] - [b[0] + c[0], b[1] + c[1]][1]];
// }

/*global cadd cplx creal cimag exprF*/
var cplx  = exprF('re,im', function (re,im) { return '[ ' + re + ', ' + im + ']'; })
,   creal = exprF('a',     function (a) { return a + '[0]'; })
,   cimag = exprF('a',     function (a) { return a + '[1]'; })
,   cadd  = exprF('a,b',   function (a,b)   { return cplx( creal(a) + '+' + creal(b), cimag(a) + '+' + cimag(b) ); } )
,   csub  = exprF('a,b',   function (a,b)   { return cplx( creal(a) + '-' + creal(b), cimag(a) + '-' + cimag(b) ); } )
;
function exprF(/*comma-separated string*/varstr, /*function*/exprgen)
{
    if (exprF.within)
        throw new Error('only one exprF at a time!');
    exprF.within = 1;
    

    var vararr = varstr.split(',').map(function(s) { return s.trim(); })
    ,   direct = new Function (varstr, 'return ' + exprgen.apply(null,vararr) + ';')  // To be called with values
    ;
    
    delete exprF.within;

    switcher.exprgen = exprgen; // xxx debug
    switcher.direct  = direct;  // xxx debug

    return switcher;

    function switcher()
    {
        if (exprF.within)
            return exprgen.apply( null, arguments );  // To be called with variable name strings
        return direct.apply( null, arguments );
    }
}

var a = cplx(1,2)
,   b = cplx(10,100)
,   c = cadd(a,b)
,   d = csub(a,cadd(b,c))
,   f = exprF('a,b,c',function (a,b,c) { return csub(a,cadd(b,c));})
,  d2 = f(a,b,c)
;
