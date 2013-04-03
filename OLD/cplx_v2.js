// Preliminary experiment to generate functions. 
// Use case: calculations in complex domain.
//
// Diff with ./cplx_v1.js:
// `f.direct` is created only when needed.
//
// We introduced a `switcher` wrapper, for three reasons:
// 
// (1) The user does not need anymore to write `.expr` everywhere.
//
// (2) The `direct` code is generated only when needed, and thus only
// the needed code is generated,
//
// (3) Mutually dependent expressions can be written without taking care 
// of the order.
// 
// Guillaume Lathoud
// December 2012
//
// cadd:
// function switcher() {
//     if (exprF.creatingDirect) {
//         return exprgen.apply(null, arguments);
//     }
//     if (!direct) {
//         if (exprF.creatingDirect) {
//             throw new Error("bug exprF direct!");
//         }
//         exprF.creatingDirect = 1;
//         direct = switcher.direct = new Function(varstr, "return " + exprgen.apply(null, vararr) + ";");
//         exprF.creatingDirect = 0;
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
var cadd  = exprF('a,b',   function (a,b)   { return cplx( creal(a) + '+' + creal(b), cimag(a) + '+' + cimag(b) ); } )
,   csub  = exprF('a,b',   function (a,b)   { return cplx( creal(a) + '-' + creal(b), cimag(a) + '-' + cimag(b) ); } )
,   creal = exprF('a',     function (a) { return a + '[0]'; })
,   cimag = exprF('a',     function (a) { return a + '[1]'; })
, cplx  = exprF('re,im',   function (re,im) { return '[ ' + re + ', ' + im + ']'; })
;
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
            return exprgen.apply( null, arguments );  // To be called with variable name strings
        
        if (!direct)
        {
            if (exprF.creatingDirect)
                throw new Error('bug exprF direct!');
            exprF.creatingDirect = 1;
            direct = switcher.direct = new Function (varstr, 'return ' + exprgen.apply(null,vararr) + ';');  // To be called with values)
            exprF.creatingDirect = 0;
        }

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
