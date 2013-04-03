// Preliminary experiment to generate functions. 
// Use case: calculations in complex domain.
//
// Guillaume Lathoud
// December 2012
//
// cadd:
// function anonymous(a, b) {
//     return [a[0] + b[0], a[1] + b[1]];
// }

/*global cadd cplx creal cimag exprF*/
var cplx  = exprF('re,im', function (re,im) { return '[ ' + re + ', ' + im + ']'; })
,   creal = exprF('a',     function (a) { return a + '[0]'; })
,   cimag = exprF('a',     function (a) { return a + '[1]'; })
,   cadd  = exprF('a,b',   function (a,b)   { return cplx.expr( creal.expr(a) + '+' + creal.expr(b), cimag.expr(a) + '+' + cimag.expr(b) ); } )
;
function exprF(/*comma-separated string*/varstr, /*function*/exprgen)
{
    var vararr = varstr.split(',').map(function(s) { return s.trim(); })
    ,      ret = new Function (varstr, 'return ' + exprgen.apply(null,vararr) + ';')  // To be called with values
    ;
    ret.expr = exprgen;  // To be called with variable names (strings)
    return ret;
}

var a = cplx(1,2)
,   b = cplx(10,100)
,   c = cadd(a,b)
;
